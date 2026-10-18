"""Build the offline CNN scripts from licensed pretrained Keras checkpoints.

Requires numpy and h5py. Checkpoint URLs and notices: handwriting-model-notes.md.
No model training or network access occurs in this converter.
"""
from pathlib import Path
import argparse,base64,hashlib,json
import numpy as np
import h5py

parser=argparse.ArgumentParser()
parser.add_argument('--source-dir',type=Path,required=True)
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'whiteboard-handwriting-character-models-beta.js')
parser.add_argument('--metrics',type=Path)
args=parser.parse_args();ROOT=args.source_dir
expected={'nlcnn-emnist.h5':'05aec3037fbedceedddf5dcac722ecd4dfe9f2fb15bc2f71f664ed0ca2644d44','letters-cnn.h5':'11a41fe3e7d25463559645c0e9a6e10b498c536e92388fca113f5c759b148f61'}
for name,digest in expected.items():
 if hashlib.sha256((ROOT/name).read_bytes()).hexdigest()!=digest:raise ValueError('Unexpected checkpoint hash: '+name)

def load(name):
 result=[]
 with h5py.File(ROOT/name) as f:
  config=json.loads(f.attrs['model_config'])['config']['layers']
  for l in config:
   c=l['config'];kind=l['class_name'];weights={}
   if c['name'] in f['model_weights']:f['model_weights'][c['name']].visititems(lambda n,x:weights.update({n.split('/')[-1].split(':')[0]:np.array(x)}) if isinstance(x,h5py.Dataset) else None)
   if kind=='Conv2D':
    w=weights['kernel'];result.append({'type':'conv','shape':list(w.shape),'w':w,'bias':weights['bias'],'pad':c['padding'],'stride':c['strides'][0]})
    if c['activation']=='relu':result.append({'type':'relu'})
   elif kind=='BatchNormalization':
    scale=weights['gamma']/np.sqrt(weights['moving_variance']+c['epsilon']);offset=weights['beta']-weights['moving_mean']*scale
    if result[-1]['type']=='conv':result[-1]['w']*=scale;result[-1]['bias']=result[-1]['bias']*scale+offset
    else:result.append({'type':'affine','scale':scale,'bias':offset})
   elif kind=='Activation':assert c['activation']=='relu';result.append({'type':'relu'})
   elif kind=='MaxPooling2D':result.append({'type':'pool','size':c['pool_size'][0],'stride':c['strides'][0],'pad':c['padding']})
   elif kind=='GlobalAveragePooling2D':result.append({'type':'avg'})
   elif kind=='Flatten':result.append({'type':'flatten'})
   elif kind=='Dense':
    result.append({'type':'dense','shape':list(weights['kernel'].shape),'w':weights['kernel'],'bias':weights['bias']})
    if c['activation']=='relu':result.append({'type':'relu'})
   elif kind not in ['InputLayer','Dropout']:raise ValueError(kind)
 return result

models={'mixed':{'layers':load('nlcnn-emnist.h5'),'labels':'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabdefghnqrt'},'letters':{'layers':load('letters-cnn.h5'),'labels':'ABCDEFGHIJKLMNOPQRSTUVWXYZ'}}
metrics=json.loads(args.metrics.read_text()) if args.metrics else {}
payload={}
for name,m in models.items():
 layers=[]
 for l in m['layers']:
  out={k:v for k,v in l.items() if k!='w'}
  if 'w' in l:
   w=l['w'];scale=np.maximum(np.max(np.abs(w),axis=tuple(range(w.ndim-1)))/127,1e-9);q=np.round(w/scale).clip(-127,127).astype(np.int8)
   out['weights']=base64.b64encode(q.tobytes()).decode();out['scales']=scale.tolist()
  for k,v in list(out.items()):
   if isinstance(v,np.ndarray):out[k]=v.tolist()
  layers.append(out)
 payload[name]={'labels':m['labels'],'layers':layers}
 if name in metrics:payload[name]['validation']={k:v for k,v in metrics[name].items() if k in ['samples','correct','case_folded_accuracy','per_class_recall']}
args.output.write_text('/* Pretrained EMNIST CNN weights. Sources and MIT notices: handwriting-model-notes.md and vendor/handwriting/. */\nglobalThis.WhiteboardCharacterModels='+json.dumps(payload,separators=(',',':'))+';\n')
print('Wrote',args.output.name,args.output.stat().st_size,'bytes')

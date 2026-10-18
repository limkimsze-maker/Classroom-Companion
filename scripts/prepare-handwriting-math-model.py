"""Preserve centered ConvInteger weights while making htt-mini ORT 1.18 compatible.

Usage: python prepare-handwriting-math-model.py encoder.onnx encoder-u8.onnx
Requires onnx and numpy. Source/revision/license: vendor/handwriting/math/NOTICE.md.
"""
import sys
import numpy as np
import onnx
from onnx import numpy_helper

model = onnx.load(sys.argv[1])
names = {n.input[i] for n in model.graph.node if n.op_type == "ConvInteger"
         for i in (1, 3)}
changed = 0
for tensor in model.graph.initializer:
    if tensor.name not in names:
        continue
    old = numpy_helper.to_array(tensor)
    if old.dtype != np.int8:
        raise ValueError(f"Expected original signed int8 tensor: {tensor.name}")
    new = old.astype(np.int16) + 128
    tensor.CopyFrom(numpy_helper.from_array(new.astype(np.uint8), tensor.name))
    changed += 1
if changed != 4:
    raise ValueError(f"Expected two convolution weights and two zero points, got {changed}")
onnx.checker.check_model(model)
onnx.save(model, sys.argv[2])

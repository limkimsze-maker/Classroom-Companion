'use strict';
// Synthetic public fixtures. No teacher's uploaded document is stored here.
const JSZip=require('../vendor/moe/jszip.min.js');
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const run=t=>`<w:r><w:t xml:space="preserve">${escape(t)}</w:t></w:r>`;
const tab='<w:r><w:tab/></w:r>';
const para=(content,pr='')=>`<w:p><w:pPr>${pr}</w:pPr>${content}</w:p>`;
function shape(preset='diamond'){
 return `<w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="1" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="margin"><wp:posOffset>457200</wp:posOffset></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>190500</wp:posOffset></wp:positionV><wp:extent cx="1828800" cy="914400"/><wp:wrapNone/><wp:docPr id="10" name="A standard ${preset}"/><a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:cNvSpPr/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1828800" cy="914400"/></a:xfrm><a:prstGeom prst="${preset}"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="FFF2CC"/></a:solidFill><a:ln w="25400"><a:solidFill><a:srgbClr val="17324D"/></a:solidFill></a:ln></wps:spPr><wps:txbx><w:txbxContent>${para(run('A positioned label'))}</w:txbxContent></wps:txbx><wps:bodyPr lIns="91440" rIns="91440" tIns="45720" bIns="45720" anchor="ctr"/></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`;
}
const table=count=>`<w:tbl><w:tblPr><w:tblW w:w="6000" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="3000"/><w:gridCol w:w="3000"/></w:tblGrid>${Array.from({length:count},(_,i)=>`<w:tr><w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>${para(run('Row '+(i+1)))}</w:tc><w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>${para(run('Second column'))}</w:tc></w:tr>`).join('')}</w:tbl>`;
async function makeDocx({landscape=false,kind='pages',preset='diamond',start=1}={}){
 const zip=new JSZip();
 const ns='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"';
 let body;
 if(kind==='flow')body=Array.from({length:85},(_,i)=>para(run(`Flow paragraph ${i+1}. This sentence is a general layout check.`))).join('');
 else if(kind==='long-paragraph')body=para(run(Array.from({length:1200},(_,i)=>'word'+i+' ').join('')));
 else if(kind==='table')body=para(run('A table crossing pages'))+table(90);
 else if(kind==='full-floating')body=para(run('A full-width floating table'))+table(90).replace('<w:tblPr>','<w:tblPr><w:tblpPr w:vertAnchor="text" w:horzAnchor="margin" w:tblpY="70"/>').replace('w:w="6000"','w:w="9746"')+para('')+para(run('After the floating table'))+para(shape(preset));
 else if(kind==='cached-break')body=para(run('Before the saved Word page break')+'<w:r><w:lastRenderedPageBreak/></w:r>'+run('After the saved Word page break'));
 else body=para(run('First original page'))+
  para(run('8.')+tab+run('Text after a hanging indent.'),'<w:ind w:left="720" w:hanging="720"/><w:tabs><w:tab w:val="clear" w:pos="4153"/><w:tab w:val="clear" w:pos="8306"/></w:tabs>')+
  para(run('(b)')+tab+run('Text after an ordinary tab.'),'<w:ind w:firstLine="720"/><w:tabs><w:tab w:val="clear" w:pos="4153"/></w:tabs>')+
  para(run('An ordinary table'))+table(2)+para(shape(preset))+
  para(run('Second original page'),'<w:pageBreakBefore/>')+
  para(run('Left value')+tab+run('Right value'),'<w:tabs><w:tab w:val="right" w:pos="6000"/></w:tabs>')+
  para(run('Third original page'),'<w:pageBreakBefore/>');
 const sect=`<w:sectPr><w:footerReference w:type="default" r:id="footer"/><w:pgSz w:w="${landscape?15840:11906}" w:h="${landscape?12240:16838}"${landscape?' w:orient="landscape"':''}/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="360" w:footer="360"/><w:pgNumType w:start="${start}"/></w:sectPr>`;
 zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>');
 zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="main" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 zip.file('word/document.xml',`<w:document ${ns}><w:body>${body}${sect}</w:body></w:document>`);
 zip.file('word/_rels/document.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="footer" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>');
 zip.file('word/styles.xml',`<w:styles ${ns}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="24"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>`);
 zip.file('word/footer1.xml',`<w:ftr ${ns}>${para(run('Page ')+'<w:fldSimple w:instr="PAGE">'+run('9')+'</w:fldSimple>'+run(' of ')+'<w:fldSimple w:instr="NUMPAGES">'+run('9')+'</w:fldSimple>','<w:jc w:val="center"/>')}</w:ftr>`);
 return zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
}
module.exports={makeDocx};

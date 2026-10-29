/* Translate interface controls only. Board text, dictation, uploaded documents,
 * saved filenames and handwriting data remain exactly as the teacher entered them. */
(function(){
'use strict';
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
if(!['ms','ta'].includes(edition))return;
const column=edition==='ms'?1:2;
const rows=[
 ['Draw','Lukis','வரை'],['Create & teach','Cipta & Ajar','உருவாக்கு & கற்பி'],['Files','Fail','கோப்புகள்'],
 ['Settings','Tetapan','அமைப்புகள்'],['Hand','Gerak','நகர்த்து'],['Point','Tunjuk','சுட்டு'],
 ['Highlighter','Penyerlah','சிறப்புக்குறி'],['Highlight:','Serlah:','சிறப்புக்குறி:'],
 ['Speech to Text','Pertuturan ke Teks','பேச்சிலிருந்து உரை'],['Convert speech to text','Tukar pertuturan kepada teks','பேச்சை உரையாக மாற்று'],
 ['Smart Math','Matematik Pintar','திறன்மிகு கணிதம்'],['Beautify','Kemaskan','அழகாக்கு'],
 ['My Documents','Dokumen Saya','எனது ஆவணங்கள்'],['Save','Simpan','சேமி'],['Restore','Pulihkan','மீட்டமை'],
 ['Open File','Buka Fail','கோப்பைத் திற'],['Open teaching file','Buka fail pengajaran','கற்பித்தல் கோப்பைத் திற'],
 ['Open a PDF, Word, PowerPoint, spreadsheet, image or other displayable file','Buka PDF, Word, PowerPoint, hamparan, imej atau fail lain','PDF, Word, PowerPoint, விரிதாள், படம் அல்லது பிற கோப்பைத் திற'],
 ['Export the current whiteboard as a PNG image','Eksport papan putih semasa sebagai imej PNG','தற்போதைய வெண்பலகையை PNG படமாக ஏற்றுமதி செய்'],
 ['Export whiteboard as PNG','Eksport papan putih sebagai PNG','வெண்பலகையை PNG ஆக ஏற்றுமதி செய்'],
 ['Save to My Documents','Simpan ke Dokumen Saya','எனது ஆவணங்களில் சேமி'],['Save Page','Simpan Halaman','பக்கத்தைச் சேமி'],
 ['Save All','Simpan Semua','அனைத்தையும் சேமி'],['Delete Page','Padam Catatan Halaman','பக்கக் குறிப்புகளை நீக்கு'],
 ['Delete All','Padam Semua Catatan','அனைத்துக் குறிப்புகளையும் நீக்கு'],['Save Annotations ▾','Simpan Catatan ▾','குறிப்புகளைச் சேமி ▾'],
 ['Exit','Keluar','வெளியேறு'],['Exit document','Keluar dokumen','ஆவணத்திலிருந்து வெளியேறு'],['Close','Tutup','மூடு'],
 ['Replace file','Ganti fail','கோப்பை மாற்று'],['Find in document','Cari dalam dokumen','ஆவணத்தில் தேடு'],
 ['Zoom in','Zum masuk','பெரிதாக்கு'],['Zoom out','Zum keluar','சிறிதாக்கு'],['Fit to page','Muat halaman','பக்கத்திற்குப் பொருத்து'],
 ['Previous page','Halaman sebelumnya','முந்தைய பக்கம்'],['Next page','Halaman seterusnya','அடுத்த பக்கம்'],
 ['Duplicate','Duplikasi','நகலெடு'],['Forward','Ke hadapan','முன்னேற்று'],['Backward','Ke belakang','பின்னேற்று'],
 ['Lock','Kunci','பூட்டு'],['Unlock','Buka kunci','பூட்டைத் திற'],['Undo','Buat asal','செயல்நீக்கு'],['Redo','Buat semula','மீண்டும் செய்'],
 ['Font','Fon','எழுத்துரு'],['Size','Saiz','அளவு'],['Bold','Tebal','தடித்த'],['Italic','Italik','சாய்வு'],['Underline','Garis bawah','அடிக்கோடு'],
 ['Align left','Jajar kiri','இடப்புறம்'],['Centre','Tengah','மையம்'],['Align right','Jajar kanan','வலப்புறம்'],
 ['Start Listening','Mula Mendengar','கேட்கத் தொடங்கு'],['Stop Listening','Berhenti Mendengar','கேட்பதை நிறுத்து'],
 ['Microphone controls','Kawalan mikrofon','ஒலிவாங்கிக் கட்டுப்பாடுகள்'],['Speech transcript','Transkrip pertuturan','பேச்சுப் பதிவு'],
 ['Insert','Masukkan','சேர்'],['Clear panel','Kosongkan panel','உரையை அழி'],['Convert maths','Tukar matematik','கணிதமாக மாற்று'],
 ['Press Start to dictate, Stop when finished. Pauses will not end your session.','Tekan Mula untuk mengimlak dan Berhenti apabila selesai. Jeda tidak akan menamatkan sesi.','பேச்சைப் பதிவு செய்யத் தொடங்கு என்பதை அழுத்தவும்; முடிந்ததும் நிறுத்து என்பதை அழுத்தவும். இடைவெளிகள் பதிவை முடிக்காது.'],
 ['Automatically capitalise sentences, days, months and common names','Gunakan huruf besar secara automatik untuk ayat, hari, bulan dan nama lazim dalam bahasa Inggeris','ஆங்கில வாக்கியங்கள், நாட்கள், மாதங்கள், பொதுவான பெயர்களின் முதலெழுத்தைத் தானாகப் பெரிய எழுத்தாக்கு'],
 ['Additional names (comma-separated)','Nama tambahan (pisahkan dengan koma)','கூடுதல் பெயர்கள் (காற்புள்ளியால் பிரிக்கவும்)'],
 ['e.g. John Tan, River Valley High School','cth. John Tan, River Valley High School','எ.கா. John Tan, River Valley High School'],
 ['Listening…','Sedang mendengar…','கேட்கிறது…'],['Stopped. You can edit the transcript.','Dihentikan. Anda boleh menyunting transkrip.','நிறுத்தப்பட்டது. பதிவைத் திருத்தலாம்.'],
 ['Press Start to listen and Stop whenever you wish.','Tekan Mula untuk mendengar dan Berhenti apabila anda mahu.','கேட்கத் தொடங்க தொடங்கு என்பதையும், விரும்பும்போது நிறுத்து என்பதையும் அழுத்தவும்.'],
 ['Speech recognition unsupported; type in the box.','Pengecaman pertuturan tidak disokong; taip dalam kotak.','பேச்சை அடையாளம் காணும் வசதி இல்லை; பெட்டியில் தட்டச்சு செய்யவும்.'],
 ['Speech recognition is not available in this browser. You can type instead.','Pengecaman pertuturan tidak tersedia dalam pelayar ini. Anda boleh menaip.','இந்த உலாவியில் பேச்சை அடையாளம் காணும் வசதி இல்லை. தட்டச்சு செய்யலாம்.'],
 ['Listening until you press Stop…','Mendengar sehingga anda menekan Berhenti…','நிறுத்து என்பதை அழுத்தும் வரை கேட்கிறது…'],
 ['Starting microphone…','Memulakan mikrofon…','ஒலிவாங்கியைத் தொடங்குகிறது…'],
 ['Stopped. Review the transcript and press Insert.','Dihentikan. Semak transkrip dan tekan Masukkan.','நிறுத்தப்பட்டது. பதிவைச் சரிபார்த்து சேர் என்பதை அழுத்தவும்.'],
 ['Stopped.','Dihentikan.','நிறுத்தப்பட்டது.'],['Finishing the last spoken words…','Menyiapkan perkataan terakhir…','கடைசியாகப் பேசிய சொற்களைப் பதிவு செய்கிறது…'],
 ['Reconnecting microphone after a pause…','Menyambung semula mikrofon selepas jeda…','இடைவெளிக்குப் பின் ஒலிவாங்கியை மீண்டும் இணைக்கிறது…'],
 ['Finish listening before inserting.','Selesaikan pendengaran sebelum memasukkan.','சேர்ப்பதற்கு முன் கேட்பதை முடிக்கவும்.'],
 ['Nothing to insert.','Tiada teks untuk dimasukkan.','சேர்க்க உரை இல்லை.'],['Inserted on whiteboard.','Dimasukkan pada papan putih.','வெண்பலகையில் சேர்க்கப்பட்டது.'],
 ['Panel cleared.','Panel dikosongkan.','உரை அழிக்கப்பட்டது.'],['Stop listening first.','Berhenti mendengar dahulu.','முதலில் கேட்பதை நிறுத்தவும்.'],
 ['Converted maths. Review before inserting.','Matematik ditukar. Semak sebelum memasukkan.','கணிதமாக மாற்றப்பட்டது. சேர்ப்பதற்கு முன் சரிபார்க்கவும்.'],
 ['Point · presentation only','Tunjuk · untuk pembentangan sahaja','சுட்டு · விளக்குவதற்கு மட்டும்'],
 ['Settings · Handwriting learning','Tetapan · Pembelajaran tulisan tangan','அமைப்புகள் · கையெழுத்துக் கற்றல்'],
 ['Handwriting settings and guide','Tetapan dan panduan tulisan tangan','கையெழுத்து அமைப்புகளும் வழிகாட்டியும்'],
 ['Handwriting learning, Import and Export JSON','Pembelajaran tulisan tangan, import dan eksport JSON','கையெழுத்துக் கற்றல், JSON இறக்குமதி மற்றும் ஏற்றுமதி'],
 ['How it works','Cara penggunaan','செயல்படும் முறை'],['Export Learning JSON','Eksport Pembelajaran JSON','கற்றலை JSON ஆக ஏற்றுமதி செய்'],
 ['Import Learning JSON','Import Pembelajaran JSON','கற்றல் JSON ஐ இறக்குமதி செய்'],
 ['Your corrections are saved in this browser, not uploaded to GitHub or a server. Import merges examples; it does not replace your existing learning or retrain the underlying model.','Pembetulan anda disimpan dalam pelayar ini, tanpa dimuat naik ke GitHub atau pelayan. Import menggabungkan contoh; ia tidak menggantikan pembelajaran sedia ada atau melatih semula model.','உங்கள் திருத்தங்கள் இந்த உலாவியில் சேமிக்கப்படுகின்றன; GitHub அல்லது சேவையகத்திற்குப் பதிவேற்றப்படுவதில்லை. இறக்குமதி எடுத்துக்காட்டுகளை இணைக்கும்; ஏற்கெனவே உள்ள கற்றலை மாற்றாது, அடிப்படை மாதிரியை மீண்டும் பயிற்றுவிக்காது.'],
 ['Write a mathematical expression with Pen, then select Beautify.','Tulis ungkapan matematik dengan Pen, kemudian pilih Kemaskan.','பேனாவால் கணிதக் கோவையை எழுதி, அழகாக்கு என்பதைத் தேர்ந்தெடுக்கவும்.'],
 ['Review the recognised expression. If it is correct, press Apply: this beautifies without training.','Semak ungkapan yang dikenal pasti. Jika betul, tekan Gunakan: tulisan dikemaskan tanpa latihan.','அடையாளம் காணப்பட்ட கோவையைச் சரிபார்க்கவும். சரியாக இருந்தால் பயன்படுத்து என்பதை அழுத்தவும்; இது பயிற்சியளிக்காமல் அழகாக்கும்.'],
 ['If recognition is wrong, correct the label to exactly what you wrote, press Learn to save the labelled strokes locally, then Apply.','Jika pengecaman salah, betulkan label agar sepadan tepat dengan tulisan anda. Tekan Belajar untuk menyimpan strok berlabel secara setempat, kemudian Gunakan.','அடையாளம் தவறாக இருந்தால், நீங்கள் எழுதியதற்கேற்ப குறியீட்டைத் திருத்தவும். குறியிடப்பட்ட கீற்றுகளைச் சாதனத்தில் சேமிக்க கற்றுக்கொள் என்பதையும், பின்னர் பயன்படுத்து என்பதையும் அழுத்தவும்.'],
 ['Try natural variations of symbols and equations. More accurate, diverse labels can improve matching, but do not guarantee recognition of every new example.','Cuba variasi simbol dan persamaan yang semula jadi. Label yang tepat dan pelbagai boleh menambah baik padanan, tetapi tidak menjamin pengecaman setiap contoh baharu.','குறியீடுகளையும் சமன்பாடுகளையும் பல இயல்பான முறைகளில் எழுதிப் பார்க்கவும். துல்லியமான, மாறுபட்ட குறியீடுகள் பொருத்தத்தை மேம்படுத்தலாம்; ஒவ்வொரு புதிய எடுத்துக்காட்டையும் அடையாளம் காணும் என உறுதியளிக்க முடியாது.'],
 ['Export learning to download a JSON backup of accumulated examples. Import learning merges a backup into this browser, skips duplicate features, respects storage limits and keeps existing local examples when duplicates occur.','Eksport pembelajaran untuk memuat turun sandaran JSON bagi contoh yang terkumpul. Import menggabungkan sandaran ke dalam pelayar ini, melangkau ciri pendua, mematuhi had storan dan mengekalkan contoh setempat yang sedia ada.','திரட்டப்பட்ட எடுத்துக்காட்டுகளின் JSON காப்புப்பிரதியைப் பதிவிறக்க கற்றலை ஏற்றுமதி செய்யவும். இறக்குமதி காப்புப்பிரதியை இந்த உலாவியில் இணைத்து, நகல்களைத் தவிர்த்து, சேமிப்பு வரம்புகளைப் பின்பற்றி, ஏற்கெனவே உள்ள எடுத்துக்காட்டுகளைப் பாதுகாக்கும்.'],
 ['Learning is specific to this browser/device. Export before clearing site data or switching devices. No automatic sharing takes place.','Pembelajaran khusus untuk pelayar/peranti ini. Eksport sebelum memadam data laman atau bertukar peranti. Tiada perkongsian automatik.','கற்றல் இந்த உலாவி/சாதனத்திற்கு உரியது. தளத் தரவை அழிக்கும் முன்பும் சாதனத்தை மாற்றும் முன்பும் ஏற்றுமதி செய்யவும். தானாகப் பகிரப்படுவதில்லை.'],
 ['Note: Export Selected Pen Strokes (inside Beautify → Settings) is for debugging a single handwriting selection, not backing up learning.','Nota: Eksport Strok Pen Terpilih (dalam Kemaskan → Tetapan) digunakan untuk menyemak satu pilihan tulisan tangan, bukan untuk menyandarkan pembelajaran.','குறிப்பு: தேர்ந்தெடுத்த பேனாக் கீற்றுகளை ஏற்றுமதி செய்தல் (அழகாக்கு → அமைப்புகளில்) ஒரு கையெழுத்துத் தேர்வின் பிழைகளை ஆராய்வதற்கானது; கற்றலைக் காப்புப்பிரதி எடுப்பதற்கானதல்ல.'],
 ['Learning module not available. Try refreshing the page.','Modul pembelajaran tidak tersedia. Cuba muat semula halaman.','கற்றல் தொகுதி கிடைக்கவில்லை. பக்கத்தைப் புதுப்பிக்கவும்.'],
 ['No saved examples to export yet.','Belum ada contoh tersimpan untuk dieksport.','ஏற்றுமதி செய்யச் சேமித்த எடுத்துக்காட்டுகள் இன்னும் இல்லை.'],
 ['Learning backup exported.','Sandaran pembelajaran dieksport.','கற்றல் காப்புப்பிரதி ஏற்றுமதி செய்யப்பட்டது.'],
 ['Last action undone','Tindakan terakhir dibuat asal','கடைசி செயல் செயல்நீக்கப்பட்டது'],
 ['Original handwriting restored','Tulisan tangan asal dipulihkan','அசல் கையெழுத்து மீட்டமைக்கப்பட்டது']
];
const labels=new Map(rows.map(row=>[row[0].toLowerCase(),row[column]]));
function translate(value){
 const text=String(value||''),trimmed=text.trim();
 let result=labels.get(trimmed.toLowerCase());
 if(!result){const match=trimmed.match(/^([^A-Za-z]*)([A-Za-z].*)$/),word=match&&labels.get(match[2].toLowerCase());if(word)result=match[1]+word}
 if(!result){const m=trimmed.match(/^Saved here: (\d+) symbol, (\d+) character, (\d+) whole-selection examples\.$/);if(m)result=edition==='ms'?`Disimpan di sini: ${m[1]} contoh simbol, ${m[2]} aksara, ${m[3]} seluruh pilihan.`:`இங்கு சேமித்தவை: ${m[1]} குறியீடு, ${m[2]} எழுத்து, ${m[3]} முழுத் தேர்வு எடுத்துக்காட்டுகள்.`}
 return result?text.replace(trimmed,result):text;
}
window.CCWhiteboardLabels={edition,translate};
const selectors='header.top,#ccSpeechToTextPanel,#mainSettingsDialog,#modeBadge,#toast,#wordTextFormatBar,#documentQuickBar,#documentSearchPanel';
const excluded='input,textarea,[contenteditable],script,style,canvas,code,[data-interim],#boardTitle,#boardSubtitle';
const observed=new WeakSet();let queued=false;
function localise(root){
 for(const element of [root,...root.querySelectorAll('[aria-label],[title],[placeholder]')]){
  if(element.closest('[contenteditable]'))continue;
  for(const attr of ['aria-label','title','placeholder']){if(!element.hasAttribute(attr))continue;const value=element.getAttribute(attr),next=translate(value);if(next!==value)element.setAttribute(attr,next)}
 }
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){if(node.parentElement?.closest(excluded))continue;const next=translate(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next}
}
function refresh(){
 queued=false;
 for(const root of document.querySelectorAll(selectors)){
  localise(root);if(observed.has(root))continue;observed.add(root);
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});
 }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(refresh)}
new MutationObserver(schedule).observe(document.body,{childList:true});
refresh();
})();

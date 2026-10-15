// Ejemplo real: "¿Por qué tus pacientes no vuelven?" (49 s, voz es-AR-ElenaNeural, marca editorial, 9:16).
// S(tipo, inicio: id de beat | w(palabra), params) · w(palabra, n) sincroniza con la voz · H() resaltado · A() acento · X(sfx, segundo)
module.exports=({S,w,H,A,X,beats})=>{
S('question','b01',{bg:'accent',kick:'CONSULTORIO',lines:['¿POR QUÉ TUS','PACIENTES','<span class="hlb">NO VUELVEN?</span>']});
S('compare','b02',{kick:'NO ES…',left:{title:'EL PRECIO',items:[{t:'Cobrar menos',at:w('precio')}]},right:{title:'NI LA COMPETENCIA',at:w('competencia'),items:[{t:'El de al lado',at:w('competencia')}]}});
S('stat','b03',{kick:'PACIENTES QUE NO REGRESAN',value:70,suffix:'%',at:w('setenta'),countEnd:w('pacientes'),label:'NO SE SINTIÓ<br>ESCUCHADO',sub:'Dato de ejemplo'});
S('title','b04',{kick:'LA BUENA NOTICIA',lines:['3 HÁBITOS','<span class="hlc">SIMPLES</span>'],sub:'y se arregla',at:[w('arregla'),w('simples')]});
S('icons','b05',{kick:'HÁBITO 01',title:'MIRÁ A LOS OJOS',items:[{icon:'eye',t:'Contacto visual',at:w('ojos')},{icon:'clock',t:'Primeros 10 segundos',at:w('diez')}]});
S('kinetic','b06',{kick:'HÁBITO 02',text:'Repetí con tus palabras',hl:['palabras']});
S('concept',w('lo'),{motif:'dialog',bg:'accent',at:w('diagnostico')});   // MG sin texto: escuchar → devolver → vínculo
S('phone','b07',{kick:'HÁBITO 03 · A LAS 48 H',name:'Laura Gómez',msgs:[{t:'Hola Laura, ¿cómo seguís?',me:true,at:w('escribile')},{t:'¡Mucho mejor! Gracias por escribirme 🙌',at:w('sigue')}]});
S('bigword','b08',{kick:'CUESTA 30 SEGUNDOS',lines:['LO','RECUERDA'],size:250,sub:'durante meses',subAt:w('meses')});
S('compare','b09',{kick:'LA DIFERENCIA',left:{title:'ANTES',items:[{t:'Se iba con una receta',at:w('receta')}]},right:{title:'AHORA',at:w('ahora'),items:[{t:'Se va sintiéndose cuidado',at:w('cuido')}]}});
S('steps','b10',{kick:'EL RESULTADO',items:[{t:'SE SIENTE CUIDADO',at:w('cuidado'),icon:'heart'},{t:'VUELVE',at:w('vuelve'),icon:'arrow'},{t:'TE RECOMIENDA',at:w('recomienda'),icon:'users'}]});
S('cta','b11',{kick:'¿TE SIRVIÓ?',lines:['SEGUIME'],btnAt:w('seguime')});
};

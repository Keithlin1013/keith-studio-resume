export async function readTrack(file){
 const track={title:file.name.replace(/\.[^.]+$/,''),artist:'Local music',url:URL.createObjectURL(file),cover:null};
 try{const b=new Uint8Array(await file.slice(0,3000000).arrayBuffer());if(new TextDecoder().decode(b.slice(0,3))!=='ID3')return track;const sync=o=>(b[o]<<21)|(b[o+1]<<14)|(b[o+2]<<7)|b[o+3],size=sync(6),v=b[3];let p=10;
 const text=bytes=>{const enc=bytes[0];return new TextDecoder(enc===1?'utf-16':enc===2?'utf-16be':enc===3?'utf-8':'iso-8859-1').decode(bytes.slice(1)).replace(/\0/g,'').trim()};
 while(p+10<Math.min(b.length,size+10)){const id=new TextDecoder().decode(b.slice(p,p+4));const n=v===4?sync(p+4):((b[p+4]*16777216)+(b[p+5]<<16)+(b[p+6]<<8)+b[p+7]);if(!n||p+10+n>b.length)break;const data=b.slice(p+10,p+10+n);if(id==='TIT2')track.title=text(data);if(id==='TPE1')track.artist=text(data);if(id==='APIC'){let k=1;while(k<data.length&&data[k])k++;const mime=new TextDecoder().decode(data.slice(1,k));k+=2;if(data[0]===1||data[0]===2){while(k+1<data.length&&(data[k]||data[k+1]))k+=2;k+=2}else{while(k<data.length&&data[k])k++;k++}if(k<data.length&&/^image\/(jpeg|png|webp)$/.test(mime))track.cover=URL.createObjectURL(new Blob([data.slice(k)],{type:mime}));}p+=10+n;}
 }catch{}return track;
}

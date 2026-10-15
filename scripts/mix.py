#!/usr/bin/env python3
"""Mezcla final: video.mp4 (render.js) + voz + música (con volumen automático) + SFX → <out_dir>/<NAME>.mp4 y .srt
uso: $PY mix.py <work>          (rápido: si cambia la música o el volumen, no hace falta volver a renderizar)
config.json → "music": {"path": ..., "offset": 12, "intro": -8, "bed": -21, "outro": -10}
  intro = dB de la música antes de que arranque la voz · bed = debajo de la voz · outro = en la cola final
  (la música se normaliza a −16 LUFS antes de aplicar esos niveles; la voz ya viene a −16 LUFS)
"""
import os as _o,sys as _s,subprocess as _sp
if _o.name=='nt' and __name__=='__main__' and not _s.flags.utf8_mode: _s.exit(_sp.run([_s.executable,'-X','utf8','-I',_o.path.abspath(__file__),*_s.argv[1:]]).returncode)
import json,os,shutil,subprocess,sys,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import timing

def srt(caps,out):
    f=lambda t:f'{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round(t%1*1000)):03d}'.replace(',1000',',999')
    open(out,'w',encoding='utf-8').write('\n'.join(f"{i+1}\n{f(c['s'])} --> {f(c['e'])}\n{' '.join(w['w'] for w in c['words'])}\n" for i,c in enumerate(caps)))
def ramp(pts):
    """pts=[(t,dB)…] → expresión de volumen de ffmpeg (lineal en dB entre puntos)"""
    e=f'{pts[-1][1]}'
    for (t0,a),(t1,b) in reversed(list(zip(pts,pts[1:]))):
        e=f'if(lt(t,{t1:.3f}),{a}+({b}-({a}))*(t-{t0:.3f})/{max(.001,t1-t0):.3f},{e})'
    return f"pow(10,({e})/20)"

def main(W):
    t0=time.time();c=json.load(open(os.path.join(W,'config.json')));vo=json.load(open(os.path.join(W,'words.json')))
    tl=json.load(open(os.path.join(W,'timeline.json')));sfx=json.load(open(os.path.join(W,'sfx.json')));caps=json.load(open(os.path.join(W,'captions.json')))
    T=tl['total'];name=c['name'];out_dir=c['out_dir'];os.makedirs(os.path.join(out_dir,'Assets'),exist_ok=True)
    vid=os.path.join(W,'video.mp4')
    if not os.path.exists(vid): raise SystemExit('Falta video.mp4: correr render.js primero')
    args=['ffmpeg','-v','error','-y','-i',vid,'-i',os.path.join(W,'voice.wav')];fc=[];mix=['[v]']
    fc.append(f"[1]atrim=0:{T:.3f},apad=whole_dur={T:.3f},aresample=48000,aformat=channel_layouts=stereo,volume=1.0[v]")
    m=c.get('music') or {};k=2
    if m.get('path'):
        vs,ve=vo['beats'][0]['s'],vo['voice_end'];intro,bed,outro=m.get('intro',-8),m.get('bed',-21),m.get('outro',-10)
        pts=[(0,intro),(max(.01,vs-.15),intro),(vs+.5,bed),(ve,bed),(ve+.7,outro),(max(ve+.8,T-1.6),outro),(T,-40)]
        args+=['-stream_loop','-1','-ss',str(m.get('offset',0)),'-i',m['path']]
        fc.append(f"[{k}]atrim=0:{T:.3f},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-2:LRA=11,aresample=48000,"
                  f"afade=t=in:d=0.25,volume='{ramp(pts)}':eval=frame[m]");mix.append('[m]');k+=1
    else: print('ℹ️  sin música (config.music.path vacío)')
    for i,x in enumerate(sfx):
        args+=['-i',x['file']];ms=int(x['start']*1000)
        fc.append(f"[{k}]atrim={x['sin']}:{x['sin']+x['dur']:.3f},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,volume={x['gain']},adelay={ms}|{ms}[s{i}]");mix.append(f'[s{i}]');k+=1
    fc.append(''.join(mix)+f"amix=inputs={len(mix)}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,atrim=0:{T:.3f}[a]")
    final=os.path.join(out_dir,name+'.mp4')
    r=subprocess.run(args+['-filter_complex',';'.join(fc),'-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','-t',f'{T:.3f}',final])
    if r.returncode: raise SystemExit('falló la mezcla')
    srt(caps,os.path.join(out_dir,name+'.srt'))
    shutil.copyfile(os.path.join(W,'voice.wav'),os.path.join(out_dir,'Assets','voz.wav'))
    if m.get('path') and os.path.exists(m['path']): shutil.copyfile(m['path'],os.path.join(out_dir,'Assets','musica'+os.path.splitext(m['path'])[1]))
    d=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',final],capture_output=True,text=True).stdout or 0)
    print(f'✓ {final} ({d:.1f} s) · subtítulos: {name}.srt · {len(sfx)} SFX');timing.log(W,'Mezcla de audio',time.time()-t0)

if __name__=='__main__':
    if len(sys.argv)<2 or sys.argv[1] in('-h','--help'): print(__doc__)
    else: main(sys.argv[1])

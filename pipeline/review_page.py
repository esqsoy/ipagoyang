"""영신 직검수 페이지(AGENTS, PRINCIPLES 7): 묶음 하나를 줄마다 댓글 다는 읽기 페이지로 만든다.

쓰는 법: python3 pipeline/review_page.py <묶음 id, 예: b01> --out <파일.html>
- 결과를 Artifact로 올린다. 올릴 때 capabilities: {comments: {}}. 줄을 누르면 입력칸이 열리고 Enter로 바로 Claude에게 간다.
  (줄 댓글 방식은 보카고양 pipeline/review-page.py에서 가져왔다. 26.10.11 영신: "라인바이라인으로 댓글달수 있게 해주고 엔터치면 바로 너에게 가는걸로")
- 원본은 data/·sources/다. 페이지는 생성물이라 손으로 고치지 않는다.
"""
import json, os, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = html.escape


def rd(*p):
    path = os.path.join(ROOT, *p)
    return json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}


CSS = r'''<style>
/* 한 줄씩 읽고 누르는 검수 장부. 기호는 IPA 글꼴로 크게, 상태는 칩으로. */
:root{
  --bg:#f3f5f7;--surface:#ffffff;--ink:#1c232d;--muted:#596474;--line:#dbe1e8;
  --accent:#2c56c9;--accent-soft:#e6ecfb;--hot:#cf4f1c;--ok:#2a7f48;--ok-soft:#e1f2e7;--warn:#a35f00;--warn-soft:#fbefd9;
  --ko:"Noto Sans KR",-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;
  --ipa:"Charis SIL","Doulos SIL","Gentium Plus","Noto Serif",serif;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#11151b;--surface:#19202a;--ink:#e5eaf1;--muted:#9ba7b7;--line:#2b3441;
  --accent:#93abff;--accent-soft:#1f2a45;--hot:#ff8a57;--ok:#66c98a;--ok-soft:#173022;--warn:#e8a94a;--warn-soft:#3a2a12;color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#11151b;--surface:#19202a;--ink:#e5eaf1;--muted:#9ba7b7;--line:#2b3441;
  --accent:#93abff;--accent-soft:#1f2a45;--hot:#ff8a57;--ok:#66c98a;--ok-soft:#173022;--warn:#e8a94a;--warn-soft:#3a2a12;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font-family:var(--ko);font-size:15px;line-height:1.6;word-break:keep-all}
.wrap{max-width:760px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:20px 48px;display:grid;gap:18px}
h1{font-size:1.5rem;margin:0;text-wrap:balance}
h2{font-size:1.08rem;margin:0 0 6px;text-wrap:balance}
.lede{color:var(--muted);margin:4px 0 0}
section{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px;display:grid;gap:4px;min-width:0}
.item{border-top:1px solid var(--line);padding-top:10px;margin-top:6px;display:grid;gap:2px}
.item:first-of-type{border-top:0;margin-top:0;padding-top:0}
.head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}
.sym{font-family:var(--ipa);font-size:1.9rem;line-height:1.1}
.ipa{font-family:var(--ipa);font-size:1.08em}
.ipa b{color:var(--hot)}
.tag{font-size:.72rem;letter-spacing:.03em;color:var(--muted);text-transform:none}
.ln{padding:2px 0;min-width:0;overflow-wrap:anywhere}
.ln > b.k{font-weight:600;font-size:.74rem;letter-spacing:.03em;color:var(--accent);margin-right:6px}
.chip{display:inline-block;font-size:.72rem;font-weight:600;padding:1px 8px;border-radius:999px;margin-left:4px;vertical-align:1px}
.chip.ok{background:var(--ok-soft);color:var(--ok)}
.chip.warn{background:var(--warn-soft);color:var(--warn)}
.why{color:var(--muted);font-size:.86rem}
.hint{font-size:.86rem;color:var(--accent);background:var(--accent-soft);border-radius:10px;padding:8px 12px}
a{color:var(--accent)}
body.cm-on .ln{cursor:text;border-radius:6px;margin-inline:-6px;padding-inline:6px}
@media (hover:hover){body.cm-on .ln:hover{background:var(--accent-soft)}}
.ln.on{background:var(--accent-soft)}
.ln.sent{box-shadow:inset 3px 0 0 var(--accent)}
.cbox{display:grid;gap:6px;margin:2px 0 6px;padding:8px;border:1px solid var(--accent);border-radius:10px;background:var(--surface)}
.cbox textarea{font:inherit;font-size:16px;line-height:1.5;width:100%;min-height:44px;resize:none;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--bg);color:var(--ink)}
.cbox textarea:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.cbox .row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;justify-content:space-between}
.cbox .st{font-size:.78rem;color:var(--muted);min-width:0}
.cbox .st.ok{color:var(--accent)}
.cbox .st.err{color:var(--hot)}
.cbox .go{font:inherit;font-size:.84rem;border:0;border-radius:8px;background:var(--accent);color:var(--surface);padding:6px 14px;min-height:36px;cursor:pointer}
.cbox .go:disabled{opacity:.5;cursor:default}
.cbox .go:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
</style>'''

COMMENT_JS = r"""<script>(function(){
const hint=document.getElementById('cmhint');
const ERR={consent_required:'허락 창에서 허용해야 보낼 수 있어. 쓴 글은 그대로 뒀어.',
forbidden:'이 화면에선 페이지에서 댓글 달기가 꺼져 있어. 범위를 지정하는 기존 댓글로 달아 줘.',
rate_limited:'너무 빨리 보냈어. 잠깐 뒤에 Enter를 다시 눌러 줘.',
claude_unavailable:'Claude에게 바로 보내기가 지금 안 돼. 쓴 글은 그대로 뒀어.',
invalid:'글이 너무 길거나 쓸 수 없는 글자가 있어.'};
let cm=null,open=null,shift=false;
function say(box,msg,cls){const s=box.querySelector('.st');s.textContent=msg;s.className='st'+(cls?' '+cls:'');}
function closeBox(){if(!open)return;open.box.remove();open.line.classList.remove('on');open=null;}
function off(msg){document.body.classList.remove('cm-on');closeBox();hint.textContent=msg;}
async function send(o){
  const ta=o.box.querySelector('textarea'),go=o.box.querySelector('.go'),text=ta.value.trim();
  if(!text||o.busy)return;
  o.busy=true;ta.readOnly=true;go.disabled=true;say(o.box,'보내는 중…');
  try{
    const anchor=await cm.anchorFor(o.line);
    let can='off';try{can=await cm.canSendToClaude();}catch(_){}
    if(can==='available'){await cm.sendToClaude({anchor,text});say(o.box,'Claude에게 보냈어.','ok');}
    else{await cm.create({anchor,text});say(o.box,'댓글로 남겼어. 바로 보내기가 지금 안 돼서, 대화창에 "댓글 봐줘"라고 해 줘.','err');}
    o.line.classList.add('sent');ta.value='';
    setTimeout(()=>{if(open===o)closeBox();},1500);
  }catch(err){
    const c=err&&err.code;
    say(o.box,ERR[c]||'못 보냈어. 쓴 글은 그대로 뒀어. 잠깐 뒤에 Enter를 다시 눌러 줘.','err');
    if(c==='forbidden'||c==='not_granted'||c==='capability_disabled'||c==='capability_removed')setTimeout(()=>off('이 화면에선 줄 댓글이 꺼져 있어. 범위를 지정하는 기존 댓글로 달아 줘.'),2500);
  }finally{o.busy=false;ta.readOnly=false;go.disabled=false;}
}
function openBox(line){
  if(open&&open.line===line){open.box.querySelector('textarea').focus();return;}
  if(open&&open.box.querySelector('textarea').value.trim()){open.box.querySelector('textarea').focus();say(open.box,'쓰던 글이 있어. 보내거나 Esc로 닫고 옮겨 줘.','err');return;}
  closeBox();
  const name=line.dataset.name||'이 줄';
  const box=document.createElement('div');box.className='cbox';box.setAttribute('data-uncommentable','');
  box.innerHTML='<textarea rows="1" enterkeyhint="send" maxlength="1300"></textarea><div class="row"><span class="st">Enter로 바로 보내기 · 줄바꿈은 Shift+Enter · Esc 닫기</span><button type="button" class="go">보내기</button></div>';
  const ta=box.querySelector('textarea');ta.setAttribute('aria-label',name+'에 댓글');ta.placeholder=name+'에 대한 의견';
  line.after(box);line.classList.add('on');
  const o={line,box,busy:false};open=o;
  ta.addEventListener('keydown',ev=>{
    if(ev.key==='Shift')shift=true;
    if(ev.key==='Escape'){ev.preventDefault();closeBox();return;}
    if(ev.key==='Enter'&&!ev.shiftKey){if(ev.isComposing||ev.keyCode===229)return;ev.preventDefault();send(o);}
  });
  ta.addEventListener('keyup',ev=>{if(ev.key==='Shift')shift=false;});
  ta.addEventListener('beforeinput',ev=>{if((ev.inputType==='insertLineBreak'||ev.inputType==='insertParagraph')&&!shift){ev.preventDefault();send(o);}});
  ta.addEventListener('input',()=>{ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';});
  box.querySelector('.go').addEventListener('click',()=>send(o));
  ta.focus();
}
document.addEventListener('click',ev=>{
  if(!document.body.classList.contains('cm-on'))return;
  if(ev.target.closest('.cbox,a,button'))return;
  const line=ev.target.closest('.ln');if(!line)return;
  const sel=window.getSelection();if(sel&&!sel.isCollapsed)return;
  openBox(line);
});
(async()=>{
  try{cm=await window.claude.use('comments');}catch(_){cm=null;}
  if(!cm){hint.textContent='이 화면에선 줄 댓글을 쓸 수 없어. 범위를 지정하는 기존 댓글로 달아 줘.';return;}
  document.body.classList.add('cm-on');
  hint.textContent='줄을 누르면 입력칸이 열려. 쓰고 Enter를 누르면 바로 Claude에게 가. 줄바꿈은 Shift+Enter.';
})();
})();</script>"""


def chip(status):
    if not status:
        return ''
    return f'<span class="chip {"ok" if status == "확인" else "warn"}">{E(status)}</span>'


def ln(name, key, body, raw=False):
    return f'<div class="ln" data-name="{E(name)}"><b class="k">{E(key)}</b>{body if raw else E(body)}</div>'


def tr(w):
    a, t, b = w['ipa']
    return f'<span class="ipa">[{E(a)}<b>{E(t)}</b>{E(b)}]</span>'


def main():
    bid = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'b01'
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else None
    b = rd('data', 'bundles', bid + '.json')
    sy = rd('data', 'symbols.json')
    langs = {l['id']: l for l in rd('data', 'languages.json')['langs']}
    audio = {f['id']: f for f in rd('sources', 'audio.json')['files']}
    ph = {r['word']: r for r in rd('sources', f'phoible-{bid}.json').get('results', [])}
    wk = {r['word']: r for r in rd('sources', f'wiktionary-{bid}.json').get('rows', [])}
    refs = {r['id']: r for r in rd('sources', 'references.json')['refs']}
    num = int(bid[1:])
    P = [f'<title>발음고양 묶음 {num} 검수</title><meta name="claude:viewport-fit-sides" content="cover">',
         '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Charis+SIL:wght@400;700&family=Noto+Sans+KR:wght@400;600;700&display=swap">',
         CSS, '<div class="wrap">',
         f'<header><h1>발음고양 묶음 {num} · {E(b["title"])} <span class="ipa">{E(b["symbols_title"])}</span></h1>'
         '<p class="lede">시제품 직검수. 기호 설명·낱말 전사·근거·녹음·고양이 대사를 한 줄씩 본다. '
         '<span class="chip ok">확인</span>은 이 세션에서 출처와 대조한 것, <span class="chip warn">확인 필요</span>는 원문을 못 본 것이다.</p></header>',
         '<p class="hint" id="cmhint">줄 댓글을 준비하는 중…</p>']

    # 볼 것(설계 7·8·9번과 녹음 출처는 26.11.08 영신 "일단 다 네 추천대로" 로 정해짐: PRINCIPLES 8-7~8-10)
    P.append('<section><h2>볼 것</h2>')
    got = [f for f in audio.values() if f.get('mp3')]
    mine = [a for w in b['words'] for a in [w['audio']] + w.get('audio_more', []) if audio.get(a, {}).get('mp3')]
    P.append(ln('청취 검수', '청취', f'이 묶음 녹음 {len(mine)}개(전체 {len(got)}개)를 미리보기에서 들어 보고, 이상한 게 있으면 그 줄에 적어 줘. 낱말마다 여러 화자가 있으면 재생할 때마다 다음 화자로 넘어간다. 아직 사람이 들은 파일은 없다. 미리보기: https://claude.ai/artifact/3QPEUivENNJjCLp4vcTcJo'))
    P.append(ln('낱말 고르기', '낱말', '아래 낱말들이 괜찮은지(짧고 흔한지, 대상 소리가 첫머리에 오는지) 봐 줘. 바꾸고 싶은 낱말이 있으면 그 줄에.'))
    P.append(ln('줄임 입력', '줄임', '치는 법: ' + ', '.join(f'{k} → {v}' for k, v in b['shortcuts'].items()) + '. 손에 맞는지?'))
    P.append(ln('한국어 녹음', '한국어 녹음', '영신 녹음 없이 Commons·Lingua Libre의 한국어 원어민 녹음을 썼다(26.11.08 영신 "내 녹음 없이 최대한 진행해보자"). 화자는 아래 녹음 줄에 있다. 나중에 녹음하면 더하거나 바꾼다.'))
    P.append('</section>')

    # 기호
    P.append('<section><h2>기호 설명</h2>')
    for k in b['learn']:
        s = sy['symbols'][k]
        P.append(f'<div class="item"><div class="head"><span class="sym">{E(k)}</span><b>{E(s["name"])}</b>{chip(s.get("status"))}</div>')
        P.append(ln(f'[{k}] 한자·영어 이름', '한자·영어', f'{s.get("name_hanja", "")} · {s.get("name_en", "")}'))
        P.append(ln(f'[{k}] 내는 법', '내는 법', s['how']))
        P.append(ln(f'[{k}] 한국어와', '한국어와', s['ko']))
        if s.get('other'):
            P.append(ln(f'[{k}] 다른 표기', '다른 표기', s['other']))
        ev = '; '.join(f'{refs.get(e["src"], {}).get("id", e["src"])}: {e.get("note", "")}' for e in s.get('evidence', []))
        P.append(ln(f'[{k}] 근거', '근거', ev))
        if s.get('status_why'):
            P.append(f'<div class="why">{E(s["status_why"])}</div>')
        P.append('</div>')
    P.append('</section>')

    # 발음 용어(PRINCIPLES 2-5)
    terms = rd('data', 'terms.json')['terms']
    P.append('<section><h2>발음 용어 한자·영어</h2><p class="why">한자는 표준국어대사전 표제어 원어로 대조했다. 사전에 없는 말은 구성 요소 한자로 맞춘 것이라 따로 표시했다.</p>')
    for t in terms.values():
        src = t.get('source', {})
        where = f'표준국어대사전 {src["word_no"]}' if src.get('word_no') else ('사전 표제어 없음: ' + ' + '.join(src.get('composed_from', [])) if src.get('composed_from') else src.get('ref', ''))
        extra = ' · '.join(x for x in [f'고유어 {t["native"]}' if t.get('native') else '', t.get('note', '')] if x)
        P.append(ln(f'용어 {t["ko"]}', t['ko'], f'{t["hanja"]} · {t["en"]} · {where}' + (f' · {extra}' if extra else '')))
    P.append('</section>')

    # 낱말
    P.append('<section><h2>낱말과 녹음</h2>')
    for w in b['words']:
        L = langs[w['lang']]
        P.append(f'<div class="item"><div class="head"><span class="tag">{E(L["ko"])} · {E(L["variety"])}</span>'
                 f'<b>{E(w["text"])}</b>{tr(w)}<span class="why">{E(w["ko"])}</span>{chip(w.get("status"))}</div>')
        if w.get('note'):
            P.append(ln(f'{w["text"]} 메모', '메모', w['note']))
        r = ph.get(w['id'], {})
        pv = f'목록 {r.get("inv")} 음소 {r.get("seg")}' + (f' · 변이음 {r.get("allo")}' if r.get('allo') else '') + (' · 맞음' if r.get('ok') else ' · 어긋남')
        P.append(ln(f'{w["text"]} PHOIBLE', 'PHOIBLE', pv))
        k2 = wk.get(w['id'], {})
        wv = ', '.join(k2.get('wiktionary', [])) or '없음'
        P.append(ln(f'{w["text"]} Wiktionary', 'Wiktionary', f'{wv} · 대상 소리 {"맞음" if k2.get("target_ok") else "확인 필요"}'))
        for aid in [w.get('audio')] + w.get('audio_more', []):
            a = audio.get(aid, {})
            got = '게임에 들어감' if a.get('mp3') else ('녹음 없음' if not a.get('commons_file') else '아직 못 받음')
            P.append(ln(f'{w["text"]} 녹음 {aid}', '녹음',
                        f'<a href="{E(a.get("page", ""))}" target="_blank" rel="noopener">{E(a.get("commons_file", "없음"))}</a> · {E(a.get("author", ""))} · {E(a.get("license", ""))} · {E(a.get("speaker", ""))} · {got} · 청취 {"했음" if a.get("listened") else "대기"}', raw=True))
        P.append('</div>')
    P.append('</section>')

    # 견주기
    P.append('<section><h2>한국어와 견주기</h2>')
    for c in b['compare']:
        w = next(x for x in b['words'] if x['id'] == c['word'])
        P.append(f'<div class="item"><div class="head"><b>{E(w["text"])}</b>{tr(w)}{chip(c.get("status"))}</div>')
        P.append(ln(f'{w["text"]} 물음', '물음', f'{c["q"]} ({" · ".join(c["options"])}) → {c["answer"]}'))
        P.append(ln(f'{w["text"]} 풀이', '풀이', c['why']))
        P.append(f'<div class="why">{E(c.get("status_why", ""))}</div></div>')
    P.append('</section>')

    # 고양이·체감
    P.append('<section><h2>고양이 대사</h2>')
    L = b['lines']
    if L.get('start'):
        P.append(ln('시작 대사', '시작', L['start'] + ' (지금은 게임에 안 나온다: 틀의 시작 대사는 모든 강이 함께 써서, 이 묶음에만 맞는 대사는 빼 두었다)'))
    for i, t in enumerate(L['correct']):
        P.append(ln(f'맞힘 대사 {i + 1}', '맞힘', t))
    for i, t in enumerate(L['wrong']):
        P.append(ln(f'틀림 대사 {i + 1}', '틀림', t))
    for wid, t in L.get('by_word', {}).items():
        P.append(ln(f'{wid} 대사', wid, t))
    P.append(ln('끝 대사', '끝', L['end']))
    P.append('</section><section><h2>체감 연습</h2>')
    for i, f in enumerate(b.get('feel', [])):
        P.append(ln(f'체감 {i + 1}', ' · '.join(f['for']), f['text']))
    P.append('</section></div>')
    P.append(COMMENT_JS)
    page = '\n'.join(P)
    if out:
        open(out, 'w', encoding='utf-8').write(page)
        print(out, len(page))
    else:
        print(page)


if __name__ == '__main__':
    main()

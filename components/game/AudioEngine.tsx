import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const HTML = `<!DOCTYPE html><html><head>
<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style>
</head><body><script>
(function(){
  var ctx = new (window.AudioContext || window.webkitAudioContext)();
  var sfxEnabled = true;

  /* ── Reverb (delay network) ─────────────────────────────────────── */
  var rev = null;
  function getRev() {
    if (rev) return rev;
    var d1 = ctx.createDelay(1); d1.delayTime.value = 0.13;
    var d2 = ctx.createDelay(1); d2.delayTime.value = 0.22;
    var f1 = ctx.createGain(); f1.gain.value = 0.22;
    var f2 = ctx.createGain(); f2.gain.value = 0.18;
    var wet = ctx.createGain(); wet.gain.value = 0.26;
    d1.connect(f1); f1.connect(d2); d2.connect(f2); f2.connect(d1);
    d1.connect(wet); d2.connect(wet); wet.connect(ctx.destination);
    rev = d1; return rev;
  }

  /* ── SFX ────────────────────────────────────────────────────────── */

  function playMerge(value) {
    var step = Math.log2(Math.max(2, value));
    var base = 290 * Math.pow(1.21, step - 1);
    var now = ctx.currentTime;
    [[1, 0.30], [2, 0.11], [3, 0.04]].forEach(function(h) {
      var freq = base * h[0]; var vol = h[1];
      var osc = ctx.createOscillator(); var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.018, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.04);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(vol, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.60 + h[0] * 0.09);
      osc.connect(g); g.connect(ctx.destination); g.connect(getRev());
      osc.start(now); osc.stop(now + 0.9);
    });
  }

  function playSwipe() {
    var now = ctx.currentTime; var dur = 0.07;
    var buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    var d = buf.getChannelData(0);
    var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
    for (var i = 0; i < d.length; i++) {
      var w = Math.random()*2-1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      d[i] = (b0+b1+b2+b3+b4+b5+w*0.5362) * 0.12;
    }
    var src = ctx.createBufferSource(); src.buffer = buf;
    var lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1050; lp.Q.value=0.35;
    var hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=180;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(1, now+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now+dur);
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(ctx.destination);
    src.start(now);
  }

  function playSpawn() {
    var now = ctx.currentTime;
    var osc = ctx.createOscillator(); var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1900, now);
    osc.frequency.exponentialRampToValueAtTime(2300, now + 0.03);
    g.gain.setValueAtTime(0.055, now); g.gain.exponentialRampToValueAtTime(0.0001, now+0.055);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now+0.07);
  }

  function playUndo() {
    var now = ctx.currentTime;
    var osc = ctx.createOscillator(); var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(490, now);
    osc.frequency.exponentialRampToValueAtTime(235, now+0.24);
    g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(0.18, now+0.016);
    g.gain.exponentialRampToValueAtTime(0.0001, now+0.3);
    osc.connect(g); g.connect(ctx.destination); g.connect(getRev());
    osc.start(now); osc.stop(now+0.35);
  }

  function playVictory() {
    var now = ctx.currentTime;
    [261.6, 329.6, 392.0, 523.3].forEach(function(freq, i) {
      var osc = ctx.createOscillator(); var g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      var t = now + i * 0.14;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.13, t+0.5);
      g.gain.setValueAtTime(0.13, now+2.4); g.gain.exponentialRampToValueAtTime(0.0001, now+5);
      osc.connect(g); g.connect(ctx.destination); g.connect(getRev());
      osc.start(t); osc.stop(now+5.5);
    });
  }

  function playGameOver() {
    var now = ctx.currentTime;
    [220, 261.6, 311.1].forEach(function(freq, i) {
      var osc = ctx.createOscillator(); var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.93, now+3);
      var t = now + i * 0.09;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.11, t+0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, now+4);
      osc.connect(g); g.connect(ctx.destination); g.connect(getRev());
      osc.start(t); osc.stop(now+4.5);
    });
  }

  window.setSfxEnabled = function(v) { sfxEnabled = v; };

  window.playSound = function(type, value) {
    try {
      if (ctx.state === 'suspended') ctx.resume();
      if (!sfxEnabled) return;
      switch(type) {
        case 'merge':    playMerge(value || 2); break;
        case 'swipe':    playSwipe();            break;
        case 'spawn':    playSpawn();            break;
        case 'undo':     playUndo();             break;
        case 'victory':  playVictory();          break;
        case 'gameover': playGameOver();         break;
      }
    } catch(e) {}
  };

})();
</script></body></html>`;

export const AudioEngine = forwardRef<WebView>((_, ref) => (
  <WebView
    ref={ref}
    source={{ html: HTML }}
    style={styles.hidden}
    mediaPlaybackRequiresUserAction={false}
    allowsInlineMediaPlayback
    javaScriptEnabled
    pointerEvents="none"
  />
));

AudioEngine.displayName = 'AudioEngine';

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: -10,
    left: -10,
  },
});

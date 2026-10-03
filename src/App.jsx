import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowDown, ArrowLeft, ArrowRight, Heart, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';

const photos = Array.from({ length: 11 }, (_, index) => ({
  src: `${import.meta.env.BASE_URL}media/photo_${index + 1}_2026-10-02_07-12-40.jpg`,
  alt: [
    'Un tout petit nouveau-né emmitouflé dans une couverture bleue',
    'Bébé paisiblement endormi dans un plaid',
    'Maman et son bébé réunis pour un selfie',
    'Maman tient son bébé contre elle',
    'Un doux portrait en noir et blanc de maman et bébé',
    'Maman et son petit garçon à la fête',
    'Le petit garçon dans son costume bleu de fête',
    'Le petit garçon en costume bleu, prêt pour la fête',
    'Un sourire dans sa tenue tricotée bleue',
    'Un instant complice dans sa tenue bleue',
    'Un souvenir tendre dans sa tenue rayée',
  ][index],
}));

function FloatingScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.z = 14;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const palette = [0x164ca1, 0x3f78ce, 0x91b9ed, 0xe7bf69, 0xffffff];
    const shapes = [];
    for (let index = 0; index < 42; index += 1) {
      const radius = 0.045 + Math.random() * 0.13;
      const material = new THREE.MeshBasicMaterial({
        color: palette[index % palette.length],
        transparent: true,
        opacity: 0.28 + Math.random() * 0.4,
        wireframe: index % 7 === 0,
      });
      const geometry = index % 7 === 0
        ? new THREE.IcosahedronGeometry(radius * 1.8, 0)
        : new THREE.SphereGeometry(radius, 12, 10);
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 13, -2 - Math.random() * 10);
      particle.userData = { speed: 0.002 + Math.random() * 0.006, drift: (Math.random() - 0.5) * 0.002 };
      scene.add(particle);
      shapes.push(particle);
    }

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (!reducedMotion) {
        shapes.forEach((shape) => {
          shape.position.y += shape.userData.speed;
          shape.position.x += shape.userData.drift;
          shape.rotation.x += 0.002;
          shape.rotation.y += 0.003;
          if (shape.position.y > 7) shape.position.y = -7;
        });
      }
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      shapes.forEach((shape) => {
        shape.geometry.dispose();
        shape.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="three-scene" ref={mountRef} aria-hidden="true" />;
}

function Celebration({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return undefined;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const colors = ['#f0ca65', '#8db8fa', '#ffffff', '#e58aa4', '#6ad5ca'];
    const particles = [];
    let frame;
    let elapsed = 0;
    let lastBurst = 0;
    let previous = performance.now();
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = bounds.width * ratio;
      canvas.height = bounds.height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const burst = (width, height) => {
      const originX = width * (0.18 + Math.random() * 0.64);
      const originY = height * (0.18 + Math.random() * 0.46);
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let index = 0; index < 42; index += 1) {
        const angle = (index / 42) * Math.PI * 2;
        const speed = 0.6 + Math.random() * 2.8;
        particles.push({ x: originX, y: originY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, decay: 0.012 + Math.random() * 0.014, color, size: 1 + Math.random() * 2.2 });
      }
    };
    const animate = (now) => {
      const delta = Math.min(now - previous, 32);
      previous = now;
      elapsed += delta;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (elapsed - lastBurst > 420) {
        burst(width, height);
        lastBurst = elapsed;
      }
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.x += particle.vx * delta * 0.055;
        particle.y += particle.vy * delta * 0.055;
        particle.vy += delta * 0.00008;
        particle.life -= particle.decay * delta * 0.06;
        context.globalAlpha = Math.max(particle.life, 0);
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        if (particles[index].life <= 0) particles.splice(index, 1);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active]);

  if (!active) return null;
  return <div className="celebration" aria-live="polite"><canvas ref={canvasRef} /><div className="celebration-message"><span>1er OCTOBRE</span><strong>Une année de plus</strong><small>et bien plus de beaux souvenirs</small></div></div>;
}

const moodTracks = [
  [392, 440, 523.25, 659.25, 587.33, 523.25, 440, 392],
  [329.63, 392, 440, 493.88, 440, 392, 329.63, 293.66],
  [349.23, 440, 523.25, 587.33, 523.25, 440, 392, 349.23],
];

const slideshowMessages = {
  0: 'Mon petit cœur, tu es notre plus grand bonheur',
  1: 'Ziame Matheo, tu illumines nos jours',
  2: 'Rose, ton amour transforme chaque instant en douceur',
  3: 'Tu es notre étoile, Rose, notre maison de tendresse',
  4: 'Pour Rose, la plus belle maman de nos souvenirs',
  5: 'Rose, ton sourire est le plus beau rayon de notre vie',
  6: 'Petit Ziame, tu es la joie qui a illuminé nos coeurs',
  7: 'Ziame Matheo, toi, notre miracle, notre amour vivant',
  8: 'Notre petit ZIAME, tu es la lumière de notre monde',
  9: 'Pour lui, notre petit trésor, notre plus grand amour',
  10: 'À toi, notre petit prince, notre amour infini',
};

function SlideshowThreeScene({ active }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!active || !mountRef.current) return undefined;
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 17);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    const palette = [0xf6d36a, 0x8ec5ff, 0xffa5c9, 0xffffff, 0x7ef0d5];
    const stars = [];

    for (let index = 0; index < 36; index += 1) {
      const geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.18, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: palette[index % palette.length],
        transparent: true,
        opacity: 0.82,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, -2 - Math.random() * 12);
      mesh.userData = { speed: 0.005 + Math.random() * 0.012, drift: (Math.random() - 0.5) * 0.015 };
      group.add(mesh);
      stars.push(mesh);
    }

    scene.add(group);

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      group.rotation.y += 0.0035;
      group.rotation.x = Math.sin(Date.now() * 0.0007) * 0.35;
      stars.forEach((star) => {
        star.position.y += star.userData.speed;
        star.position.x += star.userData.drift;
        if (star.position.y > 6) star.position.y = -6;
        if (star.position.x > 8) star.position.x = -8;
        if (star.position.x < -8) star.position.x = 8;
      });
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      stars.forEach((star) => {
        star.geometry.dispose();
        star.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [active]);

  if (!active) return null;
  return <div className="slideshow-three-scene" ref={mountRef} aria-hidden="true" />;
}

function App() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [slideshow, setSlideshow] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [soundNeedsGesture, setSoundNeedsGesture] = useState(false);
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const [showLaunchPrompt, setShowLaunchPrompt] = useState(false);
  const videoRef = useRef(null);
  const celebrationTimer = useRef(null);
  const slideshowTimer = useRef(null);
  const audioContext = useRef(null);
  const soundtrackRef = useRef(null);
  const trackIndexRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setVideoFullscreen(true);
    video.play().then(() => {
      setPlaying(true);
      setAutoplayBlocked(false);
    }).catch(() => {
      setPlaying(false);
      setAutoplayBlocked(true);
    });
  }, []);

  const togglePlayback = async () => {
    if (!videoRef.current) return;
    setVideoFullscreen(true);
    if (videoRef.current.paused) {
      try {
        videoRef.current.muted = false;
        setMuted(false);
        await videoRef.current.play();
        setPlaying(true);
        setAutoplayBlocked(false);
      } catch {
        setPlaying(false);
        setAutoplayBlocked(true);
      }
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const toggleSound = async () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    setVideoFullscreen(true);
    if (!nextMuted) {
      try {
        await video.play();
        setPlaying(true);
        setSoundNeedsGesture(false);
        setAutoplayBlocked(false);
      } catch {
        setSoundNeedsGesture(true);
      }
    }
  };

  const movePhoto = (direction) => {
    setSelectedPhoto((current) => (current + direction + photos.length) % photos.length);
  };

  const stopSlideshow = () => {
    window.clearInterval(slideshowTimer.current);
    setSlideshow(false);
    setSelectedPhoto(null);
    if (soundtrackRef.current) {
      soundtrackRef.current.pause();
      soundtrackRef.current.currentTime = 0;
      soundtrackRef.current = null;
    }
    if (audioContext.current) {
      audioContext.current.close();
      audioContext.current = null;
    }
  };

  const startSlideshow = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!soundtrackRef.current) {
      const audio = new Audio(`${import.meta.env.BASE_URL}videoplayback.weba`);
      audio.loop = true;
      audio.volume = 0.8;
      soundtrackRef.current = audio;
    }

    try {
      await soundtrackRef.current.play();
    } catch {
      if (AudioContextClass) {
        audioContext.current = new AudioContextClass();
        await audioContext.current.resume();
      }
    }

    trackIndexRef.current = Math.floor(Math.random() * moodTracks.length);
    setSelectedPhoto(0);
    setSlideshow(true);
    setVideoFullscreen(false);
    setShowLaunchPrompt(false);
  };

  useEffect(() => {
    if (!slideshow) return undefined;
    const melody = moodTracks[trackIndexRef.current] || moodTracks[0];
    let beat = 0;
    const playNote = () => {
      const audio = audioContext.current;
      if (!audio || audio.state !== 'running') return;
      const start = audio.currentTime;
      const frequency = melody[beat % melody.length];
      [frequency / 2, frequency, frequency * 1.5].forEach((note, index) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = index === 0 ? 'sine' : 'triangle';
        oscillator.frequency.value = note;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(index === 1 ? 0.018 : 0.008, start + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.15);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start(start);
        oscillator.stop(start + 1.2);
      });
      beat += 1;
    };
    playNote();
    const melodyTimer = window.setInterval(playNote, 650);
    slideshowTimer.current = window.setInterval(() => {
      setSelectedPhoto((current) => (current + 1) % photos.length);
    }, 3200);
    return () => {
      window.clearInterval(melodyTimer);
      window.clearInterval(slideshowTimer.current);
    };
  }, [slideshow]);

  useEffect(() => () => {
    window.clearTimeout(celebrationTimer.current);
    window.clearInterval(slideshowTimer.current);
    soundtrackRef.current?.pause();
    soundtrackRef.current = null;
    audioContext.current?.close();
  }, []);

  const replayVideo = async () => {
    setShowLaunchPrompt(false);
    setVideoFullscreen(true);
    setCelebrating(false);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = false;
    setMuted(false);
    try {
      await video.play();
      setPlaying(true);
      setAutoplayBlocked(false);
      setSoundNeedsGesture(false);
    } catch {
      setPlaying(false);
      setAutoplayBlocked(true);
    }
  };

  const handleVideoEnded = () => {
    setCelebrating(true);
    setVideoFullscreen(true);
    celebrationTimer.current = window.setTimeout(() => {
      setCelebrating(false);
      setShowLaunchPrompt(true);
      setPlaying(false);
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }, 10000);
  };

  useEffect(() => {
    if (selectedPhoto === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (slideshow) stopSlideshow();
        setSelectedPhoto(null);
      }
      if (event.key === 'ArrowRight') movePhoto(1);
      if (event.key === 'ArrowLeft') movePhoto(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPhoto, slideshow]);

  useEffect(() => {
    if (selectedPhoto === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPhoto]);

  const closeAlbum = () => {
    if (slideshow) stopSlideshow();
    setSelectedPhoto(null);
  };

  return (
    <main>
      <section className="film-section">
        <div className="film-inner">
          <div className="film-copy"><p className="eyebrow"><span /> Comme si on y était</p><h2>Les images<br /><em>prennent vie.</em></h2><p>Un petit film pour retrouver l’énergie, les regards et tous ces instants qui passent trop vite.</p></div>
          
            <div className={`video-shell${celebrating ? ' is-celebrating' : ''}${videoFullscreen ? ' is-fullscreen' : ''}`}>
            <video ref={videoRef} src={`${import.meta.env.BASE_URL}media/A_InShot_20261001_060438370.mp4`} autoPlay muted={muted} playsInline preload="metadata" onPlay={() => { setPlaying(true); setAutoplayBlocked(false); setVideoFullscreen(true); }} onPause={() => setPlaying(false)} onEnded={handleVideoEnded} aria-label="Film souvenir d’anniversaire" />
            {autoplayBlocked && <button className="video-start" onClick={togglePlayback}><Play size={18} fill="currentColor" /> Lancer le film avec le son</button>}
            <Celebration active={celebrating} />
            <div className="video-corner">NOS INSTANTS PRÉFÉRÉS <Heart size={13} fill="currentColor" /></div>
            </div>
            <div className="film-controls">
              <button className="control-button" onClick={togglePlayback} aria-label={playing ? 'Mettre la vidéo en pause' : 'Lire la vidéo'}>{playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}</button>
              <button className="control-button" onClick={toggleSound} aria-label={muted ? 'Activer le son' : 'Couper le son'}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
              <span className="autoplay-label"><span className={playing ? 'live-dot' : 'live-dot is-paused'} /> {autoplayBlocked ? 'Touchez pour lancer le film' : soundNeedsGesture ? 'Touchez pour réactiver le son' : 'Lecture automatique avec son'}</span>
            </div>
        </div>
      </section>
      <section className="hero" id="accueil">
        <FloatingScene />
        <header className="topbar">
          <a className="wordmark" href="#accueil" aria-label="Accueil, Un jour précieux"><span className="wordmark-mark"><Heart size={15} fill="currentColor" /></span> nos beaux jours</a>
          <a className="top-link" href="#souvenirs">Les souvenirs <ArrowDown size={15} /></a>
        </header>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Un album plein d’amour</p>
            <h1>ZIAME<br /><em>MATHEO</em></h1>
            <p className="hero-intro">Des premiers instants aux grands sourires, chaque image raconte un peu de notre histoire.</p>
            <a className="discover-link" href="#souvenirs">Découvrir l’album <span><ArrowDown size={17} /></span></a>
            <div className="hero-note"><span className="note-line" /> Des souvenirs à garder près du cœur </div>
          </div>
          <div className="hero-photo-wrap">
            <div className="photo-frame">
              <img src={photos[7].src} alt={photos[7].alt} fetchPriority="high" />
              <div className="photo-caption"><span>Le grand jour</span><span>Souvenir...</span></div>
            </div>
            <div className="photo-stamp"><span>Une année</span><strong>de bonheur</strong><Heart size={19} fill="currentColor" /></div>
            <span className="decor-dot decor-dot-one" /><span className="decor-dot decor-dot-two" />
          </div>
        </div>
        <div className="hero-footer"><span>Une histoire qui grandit</span><span>01 — 11</span></div>
      </section>

      <section className="memories section-wrap" id="souvenirs">
        <div className="slideshow-toolbar">
          <p>{slideshow ? 'Un petit air original accompagne les souvenirs.' : 'Revoir les photos en musique.'}</p>
          <button className="slideshow-button" onClick={slideshow ? stopSlideshow : startSlideshow}>
            {slideshow ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            {slideshow ? 'Arrêter le diaporama' : 'Lancer le diaporama'}
          </button>
        </div>
        <div className="section-heading">
          <div><p className="eyebrow"><span /> L’album photo</p><h2>Petits instants,<br /><em>grands souvenirs.</em></h2></div>
          <p className="section-description">Les premiers jours, les bras de maman, le costume de fête… tout ce qu’on voudrait pouvoir revivre encore.</p>
        </div>
        <div className="gallery" aria-label="Galerie des souvenirs">
          {photos.map((photo, index) => (
            <button className={`gallery-item gallery-item-${index + 1}`} key={photo.src} onClick={() => setSelectedPhoto(index)} aria-label={`Ouvrir la photo ${index + 1}: ${photo.alt}`}>
              <img src={photo.src} alt={photo.alt} loading="lazy" />
              <span className="gallery-index">{String(index + 1).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      </section>


      <footer className="footer"><a className="wordmark" href="#accueil"><span className="wordmark-mark"><Heart size={15} fill="currentColor" /></span> nos beaux jours</a><p>Fait avec amour, pour ne rien oublier.</p><a href="#accueil" className="back-top">Retour en haut ↑</a></footer>

      {showLaunchPrompt && (
        <div className="celebration-prompt" role="dialog" aria-modal="true" aria-label="Confirmer le lancement du diaporama">
          <div className="prompt-card">
            <p>Un dernier souvenir</p>
            <h3>On CONTINUE ?</h3>
            <div className="prompt-actions">
              <button onClick={startSlideshow}>Oui, lancer </button>
              <button onClick={replayVideo}>Relire la vidéo</button>
            </div>
          </div>
        </div>
      )}

      {selectedPhoto !== null && (
        <div className={`lightbox${slideshow ? ' is-slideshow' : ''}`} role="dialog" aria-modal="true" aria-label={slideshow ? 'Diaporama plein écran' : 'Photo en grand format'} onClick={closeAlbum}>
          <button className="lightbox-close" aria-label="Fermer" onClick={closeAlbum}><X size={22} /></button>
          {slideshow && <button className="slideshow-stop" onClick={(event) => { event.stopPropagation(); stopSlideshow(); setSelectedPhoto(null); }}><Pause size={15} /> Arrêter le diaporama</button>}
          <button className="lightbox-arrow lightbox-prev" aria-label="Photo précédente" onClick={(event) => { event.stopPropagation(); movePhoto(-1); }}><ArrowLeft size={23} /></button>
          <figure onClick={(event) => event.stopPropagation()}>
            {slideshow && <SlideshowThreeScene active={slideshow} />}
            <img src={photos[selectedPhoto].src} alt={photos[selectedPhoto].alt} />
            {slideshow && <div className="slideshow-message">{slideshowMessages[selectedPhoto] || 'Pour le Petit ZIAME MATHEO'}</div>}
            <figcaption>{String(selectedPhoto + 1).padStart(2, '0')} <span>/</span> 11 · {photos[selectedPhoto].alt}</figcaption>
          </figure>
          <button className="lightbox-arrow lightbox-next" aria-label="Photo suivante" onClick={(event) => { event.stopPropagation(); movePhoto(1); }}><ArrowRight size={23} /></button>
        </div>
      )}
    </main>
  );
}

export default App;

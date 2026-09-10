
import rahulImg from '../assets/shri rahul.webp';
import tejasImg from '../assets/shri tejas.webp';
import milindImg from '../assets/shri millnd.webp';
import amitImg from '../assets/shri amit.webp';
import { SECTION } from '../config/site';

// `intrinsic` is the encoded pixel size of each portrait. It is passed to the
// <img> so the browser can reserve the box before the file arrives; the fixed
// 238px CSS box still decides what is actually rendered.
const artists = [
  {
    id: 1,
    name: 'Shri Rahul Deshpande',
    role: 'Classical Vocals',
    img: rahulImg,
    intrinsic: { width: 476, height: 476 },
    objectPos: 'center top',
    cardRadius: '6px 52px 32px 32px',
    imageRadius: '4px 44px 24px 24px',
  },
  {
    id: 2,
    name: 'Shri Tejas & Rajas Upadhye',
    role: 'Violin Duet',
    img: tejasImg,
    intrinsic: { width: 476, height: 568 },
    objectPos: 'center top',
    cardRadius: '50px 6px 32px 32px',
    imageRadius: '44px 4px 24px 24px',
  },
  {
    id: 3,
    name: 'Shri Milind Kulkarni',
    role: 'Harmonium',
    img: milindImg,
    intrinsic: { width: 595, height: 476 },
    objectPos: 'center top',
    cardRadius: '6px 52px 32px 32px',
    imageRadius: '4px 44px 24px 24px',
  },
  {
    id: 4,
    name: 'Shri Amit Kavthekar',
    role: 'Tabla',
    img: amitImg,
    intrinsic: { width: 476, height: 476 },
    objectPos: 'center top',
    cardRadius: '50px 6px 32px 32px',
    imageRadius: '44px 4px 24px 24px',
  },
];

export function ArtistsSection() {
  return (
    <section id={SECTION.artists} style={{ background: '#24313b', padding: '80px 24px 70px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{
            fontFamily: '"Alga", "Bodoni Moda", "Playfair Display", Georgia, serif',
            fontSize: 'clamp(26px, 3.5vw, 40px)',
            fontWeight: 400,
            color: '#f2c45a',
            margin: '0 0 12px 0',
            lineHeight: 1.2,
          }}>
            Delighted to Announce Our Artists
          </h2>
          {/* Diya flame icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#f2c45a" style={{ marginBottom: '14px' }}>
            <path d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.5 4.7 3.5 5.8L8 22h8l-1.5-8.2C16.5 12.7 18 10.5 18 8c0-3.5-2.5-6-6-6z" />
          </svg>
          <p style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: '12px',
            color: '#bcc5ce',
            maxWidth: '480px',
            margin: 0,
            lineHeight: 1.65,
          }}>
            Prepare for an immersive evening of high classical Alap, intricate Ragas, and vibrant rhythmic dialogues from India's finest maestros.
          </p>
        </div>

        {/* ── Artist Cards Grid (All 4 cards in same line) ── */}
        <div
          className="artists-grid"
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'nowrap',
          }}
        >
          {artists.map(artist => (
            <div
              key={artist.id}
              style={{
                background: '#ffffff',
                width: '250px',
                height: '306px',
                padding: '6px',
                borderRadius: artist.cardRadius,
                boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                flexShrink: 0,
                opacity: 1,
              }}
            >
              {/* ── Photo area with warm cream background ── */}
              <div style={{
                position: 'relative',
                width: '238px',
                height: '238px',
                flexShrink: 0,
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#eee5d8',
                  borderRadius: artist.imageRadius,
                  overflow: 'hidden',
                }}>
                  <img
                    src={artist.img}
                    alt={artist.name}
                    width={artist.intrinsic.width}
                    height={artist.intrinsic.height}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: artist.objectPos,
                      display: 'block',
                    }}
                  />
                </div>

                {/* Orange pill badge — centered, overlapping bottom edge */}
                <div style={{
                  position: 'absolute',
                  bottom: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#e98314',
                  color: '#ffffff',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(233,131,20,0.4)',
                  zIndex: 5,
                }}>
                  {artist.role}
                </div>
              </div>

              {/* ── Artist name ── */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12px',
                fontWeight: 700,
                color: '#e98314',
                lineHeight: 1.3,
                textAlign: 'center',
                paddingTop: '6px',
              }}>
                {artist.name}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* The .artists-grid wrap behaviour below 1180px lives in index.css - it used
          to be an inline <style> block, which re-injected the rule on every render. */}
    </section>
  );
}

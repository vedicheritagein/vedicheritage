
import rahulImg from '../assets/shri rahul.webp';
import tejasImg from '../assets/shri tejas.jpg';
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
          {/* Diya divider */}
          <div className="flex items-center gap-4 mb-4 w-[340px] h-[25px]">
            <div className="h-px flex-1 bg-[#f2c45a]/80" />
            <svg width="15" height="23" viewBox="0 0 15 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.16667 1V6.86714C5.16667 7.30884 4.88334 7.69533 4.48646 7.89014C3.43932 8.40639 2.5577 9.20564 1.9415 10.1973C1.3253 11.189 0.999145 12.3334 1 13.501C1.00625 17.668 4.125 20.7933 6.20833 21.835M5.16667 4.12525H3.08333C2.5308 4.12525 2.00089 4.34476 1.61019 4.73549C1.21949 5.12623 1 5.65617 1 6.20875C1 6.76133 1.21949 7.29128 1.61019 7.68201C2.00089 8.07274 2.5308 8.29225 3.08333 8.29225H3.79167M9.33333 1V6.86714C9.33333 7.30884 9.61667 7.69533 10.0125 7.89014C11.0598 8.40624 11.9417 9.20543 12.5581 10.1971C13.1745 11.1888 13.5008 12.3333 13.5 13.501C13.5 17.668 10.375 20.7933 8.29167 21.835M9.33333 4.12525H11.4167C11.9692 4.12525 12.4991 4.34476 12.8898 4.73549C13.2805 5.12623 13.5 5.65617 13.5 6.20875C13.5 6.76133 13.2805 7.29128 12.8898 7.68201C12.4991 8.07274 11.9692 8.29225 11.4167 8.29225H10.7083M13.5 21.835H1M4.125 1H10.375" stroke="#E59F2D" stroke-width="2" stroke-linecap="round" />
            </svg>
            <div className="h-px flex-1 bg-[#f2c45a]/80" />
          </div>
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
                fontSize: '16px',
                fontWeight: 700,
                color: '#e98314',
                lineHeight: 1.4,
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

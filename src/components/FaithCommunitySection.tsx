import React from 'react';
import { SECTION } from '../config/site';
import havanImg from '../assets/sacred-havan.webp';
import prasadImg from '../assets/prasad-feast.webp';
import aartiImg from '../assets/sacred-aarti.webp';

export interface CommunityActivity {
  id: string;
  title: string;
  image: string;
  alt: string;
}

const defaultActivities: CommunityActivity[] = [
  {
    id: 'sacred-havan',
    title: 'Sacred Havan',
    image: havanImg,
    alt: 'Sacred Havan spiritual fire ceremony with priests and devotees',
  },
  {
    id: 'prasad-feast',
    title: 'Prasad Feast',
    image: prasadImg,
    alt: 'Traditional Vedic Satvik prasad feast served in brass thali',
  },
  {
    id: 'sacred-aarti',
    title: 'Sacred Aarti',
    image: aartiImg,
    alt: 'Devotees holding sacred brass deepam aarti plates during evening prayer',
  },
];

export interface FaithCommunitySectionProps {
  title?: string;
  activities?: CommunityActivity[];
}

export const FaithCommunitySection: React.FC<FaithCommunitySectionProps> = ({
  title = 'A Place Where Faith Becomes Community',
  activities = defaultActivities,
}) => {
  return (
    <section
      id={SECTION.community}
      className="w-full bg-[#FFFFFF] py-12 md:py-8 px-2 sm:px-4 md:px-6"
    >
      <div className="w-full max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="font-['Alga','Bodoni_Moda','Playfair_Display',Georgia,serif] text-xl sm:text-2xl lg:text-[30px] font-normal text-[#2F2A24] tracking-tight leading-tight">
            {title}
          </h2>

          {/* Ornamental Divider with Vedic Kalash / Sacred Urn Motif */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="h-[1px] w-24 sm:w-36 md:w-48 bg-[#D4A266]/70" />
            <div className="text-[#D2811A] flex items-center justify-center shrink-0" aria-label="Sacred Kalash icon">
              <svg
                width="16"
                height="22"
                viewBox="0 0 16 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-[22px] transition-transform duration-300 hover:scale-110"
              >
                {/* Top Rim */}
                <path
                  d="M4.5 2.5H11.5"
                  stroke="#D2811A"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                {/* Left Ear / Handle */}
                <path
                  d="M4.5 5C3 5 2 6.2 2 7.5C2 8.8 3 10 4.5 10"
                  stroke="#D2811A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Right Ear / Handle */}
                <path
                  d="M11.5 5C13 5 14 6.2 14 7.5C14 8.8 13 10 11.5 10"
                  stroke="#D2811A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Kalash Vase Body */}
                <path
                  d="M5 2.8V5.2C5 6.2 3.8 7.5 3.3 9.5C2.6 12.2 3.8 16 8 16C12.2 16 13.4 12.2 12.7 9.5C12.2 7.5 11 6.2 11 5.2V2.8"
                  stroke="#D2811A"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Pedestal Base */}
                <path
                  d="M5.5 16L4.5 18.8H11.5L10.5 16"
                  stroke="#D2811A"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="h-[1px] w-24 sm:w-36 md:w-48 bg-[#D4A266]/70" />
          </div>
        </div>

        {/* 3 Activities Cards Grid with #D1B280 Border */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="group flex flex-col items-center cursor-pointer"
            >
              {/* Image Container with explicit #D1B280 border from design */}
              <div className="w-full aspect-[16/9] overflow-hidden rounded-[16px] sm:rounded-[18px] border-2 border-[#D1B280] shadow-sm hover:shadow-xl transition-all duration-500 bg-[#FFECD6]">
                <img
                  src={activity.image}
                  alt={activity.alt}
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </div>

              {/* Card Label */}
              <h3 className="font-['Outfit',sans-serif] mt-3 text-sm sm:text-base text-[#2F2A24] group-hover:text-[#F07B00] transition-colors duration-300 font-medium tracking-wide">
                {activity.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaithCommunitySection;

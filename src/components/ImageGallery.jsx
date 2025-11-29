import { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';

const ImageGallery = () => {
  const { portfolioData } = usePortfolio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedImage, setExpandedImage] = useState(null);
  const [shuffledImages, setShuffledImages] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (portfolioData.gallery && portfolioData.gallery.length > 0) {
      const shuffled = [...portfolioData.gallery].sort(() => Math.random() - 0.5);
      setShuffledImages(shuffled);
    }
  }, [portfolioData.gallery?.length]);

  useEffect(() => {
    if (shuffledImages.length > 0) {
      const interval = setInterval(() => {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % shuffledImages.length);
          setTimeout(() => setIsAnimating(false), 50);
        }, 350);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [shuffledImages.length]);

  useEffect(() => {
    if (!expandedImage || shuffledImages.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setExpandedImage(null);
      } else if (e.key === 'ArrowLeft') {
        const currentIdx = shuffledImages.findIndex(img => img.id === expandedImage.id);
        const prevIdx = (currentIdx - 1 + shuffledImages.length) % shuffledImages.length;
        setExpandedImage({ ...shuffledImages[prevIdx], index: prevIdx });
      } else if (e.key === 'ArrowRight') {
        const currentIdx = shuffledImages.findIndex(img => img.id === expandedImage.id);
        const nextIdx = (currentIdx + 1) % shuffledImages.length;
        setExpandedImage({ ...shuffledImages[nextIdx], index: nextIdx });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedImage?.id, shuffledImages.length]);

  if (!portfolioData.gallery || portfolioData.gallery.length === 0) {
    return null;
  }

  const handleCardClick = (image, index) => {
    setExpandedImage({ ...image, index });
  };

  const closeExpanded = () => {
    setExpandedImage(null);
  };

  const nextImage = () => {
    if (expandedImage) {
      const currentIdx = shuffledImages.findIndex(img => img.id === expandedImage.id);
      const nextIdx = (currentIdx + 1) % shuffledImages.length;
      setExpandedImage({ ...shuffledImages[nextIdx], index: nextIdx });
    }
  };

  const prevImage = () => {
    if (expandedImage) {
      const currentIdx = shuffledImages.findIndex(img => img.id === expandedImage.id);
      const prevIdx = (currentIdx - 1 + shuffledImages.length) % shuffledImages.length;
      setExpandedImage({ ...shuffledImages[prevIdx], index: prevIdx });
    }
  };

  const visibleCards = [];
  const totalCards = shuffledImages.length;
  const cardsToShow = Math.min(3, totalCards);

  for (let i = 0; i < cardsToShow; i++) {
    const index = (currentIndex + i) % totalCards;
    visibleCards.push({ ...shuffledImages[index], displayIndex: i });
  }

  return (
    <>
      <section id="gallery" className="py-20 md:py-32 relative overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-900/30 to-transparent"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Gallery
                </span>
              </h2>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-teal-500 to-emerald-500 mx-auto"></div>
            </div>

            <div className="relative py-16 overflow-hidden min-h-[600px] flex items-center">
              <div className="flex justify-center items-center gap-6 md:gap-8 w-full relative">
                {visibleCards.map((image, idx) => {
                  const actualIndex = (currentIndex + idx) % totalCards;
                  const baseOpacity = idx === 1 ? 1 : 0.7;
                  const currentOpacity = isAnimating ? 0 : baseOpacity;
                  return (
                    <div
                      key={`${image.id}-${actualIndex}`}
                      className="flex-shrink-0 cursor-pointer"
                      style={{ 
                        width: '300px',
                        transform: `translateX(${idx === 0 ? '-20px' : idx === 2 ? '20px' : '0px'}) scale(${idx === 1 ? '1.1' : '0.9'})`,
                        opacity: currentOpacity,
                        transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: idx === 1 ? 10 : 1,
                      }}
                      onClick={() => handleCardClick(image, idx)}
                    >
                    <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-4 border-2 border-stone-700 shadow-2xl hover:border-teal-500/50 transition-all duration-300 hover:shadow-teal-500/20">
                      <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-4 bg-stone-900">
                        {image.url ? (
                          <img
                            src={image.url}
                            alt={image.title || 'Gallery image'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <i className="fas fa-image text-5xl text-stone-700"></i>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent"></div>
                      </div>
                      <div className="px-2 pb-2">
                        <h3 className="text-stone-100 font-bold text-lg mb-2 line-clamp-2">
                          {image.title || 'Untitled'}
                        </h3>
                        <p className="text-stone-400 text-sm line-clamp-3">
                          {image.description || 'No description available'}
                        </p>
                      </div>
                      <div className="absolute top-4 right-4 bg-teal-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-teal-500/30">
                        <span className="text-teal-300 text-xs font-semibold">Click to expand</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {shuffledImages.length > 3 && (
                <div className="flex justify-center gap-2 mt-8">
                  {shuffledImages.slice(0, Math.min(5, shuffledImages.length)).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsAnimating(true);
                        setTimeout(() => {
                          setCurrentIndex(idx);
                          setTimeout(() => setIsAnimating(false), 50);
                        }, 350);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === currentIndex ? 'bg-teal-500 w-8' : 'bg-stone-600'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeExpanded}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-stone-900 rounded-2xl border border-stone-700 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeExpanded}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-stone-800/80 hover:bg-red-500/80 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Close"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            {shuffledImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-stone-800/80 hover:bg-teal-500/80 rounded-full flex items-center justify-center text-white transition-colors"
                  aria-label="Previous image"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-stone-800/80 hover:bg-teal-500/80 rounded-full flex items-center justify-center text-white transition-colors"
                  aria-label="Next image"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}

            <div className="relative aspect-video bg-stone-800">
              {expandedImage.url ? (
                <img
                  src={expandedImage.url}
                  alt={expandedImage.title || 'Expanded image'}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fas fa-image text-8xl text-stone-700"></i>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-stone-700">
              <h3 className="text-2xl font-bold text-stone-100 mb-2">
                {expandedImage.title || 'Untitled'}
              </h3>
              <p className="text-stone-300 leading-relaxed">
                {expandedImage.description || 'No description available'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;


import { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt, className, fallback, ...props }) => {
  const [imageSrc, setImageSrc] = useState(fallback || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setIsError(true);
      return;
    }

    let observer;
    const imgElement = imgRef.current;

    if ('IntersectionObserver' in window && imgElement) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imgElement);
            }
          });
        },
        {
          rootMargin: '50px',
        }
      );

      observer.observe(imgElement);
    } else {
      setImageSrc(src);
    }

    return () => {
      if (observer && imgElement) {
        observer.unobserve(imgElement);
      }
    };
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc || fallback}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

export default LazyImage;


import { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';

const Projects = () => {
  const { portfolioData } = usePortfolio();
  const [activeImageIndex, setActiveImageIndex] = useState({});
  
  if (!portfolioData) return null;
  
  const getProjectImages = (project) => {
    // Support both old format (image) and new format (images)
    if (project.images && Array.isArray(project.images) && project.images.length > 0) {
      return project.images;
    }
    if (project.image) {
      return [project.image];
    }
    return [];
  };
  
  const setActiveImage = (projectId, index) => {
    setActiveImageIndex(prev => ({ ...prev, [projectId]: index }));
  };
  
  return (
    <section id="projects" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-900/30 to-transparent"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Featured Projects
              </span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-teal-500 to-emerald-500 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolioData.projects.map((project, index) => {
              const images = getProjectImages(project);
              const currentImageIndex = activeImageIndex[project.id] || 0;
              const hasMultipleImages = images.length > 1;
              
              return (
                <div
                  key={project.id}
                  className="group relative bg-stone-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-stone-700/50 hover:border-teal-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/20 hover:-translate-y-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-emerald-500/0 group-hover:from-teal-500/10 group-hover:to-emerald-500/10 transition-all duration-500"></div>
                  
                  <div className="relative overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-stone-800 to-stone-900 relative">
                      {images.length > 0 ? (
                        <>
                          <img
                            src={images[currentImageIndex]}
                            alt={`${project.title} - Image ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          {hasMultipleImages && (
                            <>
                              {/* Image indicators */}
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-10">
                                {images.map((_, imgIndex) => (
                                  <button
                                    key={imgIndex}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveImage(project.id, imgIndex);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                      imgIndex === currentImageIndex
                                        ? 'bg-teal-400 w-6'
                                        : 'bg-stone-600/50 hover:bg-stone-500/70'
                                    }`}
                                    aria-label={`View image ${imgIndex + 1}`}
                                  />
                                ))}
                              </div>
                              {/* Navigation arrows */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImage(project.id, (currentImageIndex - 1 + images.length) % images.length);
                                }}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-stone-900/70 hover:bg-stone-900/90 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                aria-label="Previous image"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveImage(project.id, (currentImageIndex + 1) % images.length);
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-stone-900/70 hover:bg-stone-900/90 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                                aria-label="Next image"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-image text-6xl text-stone-700"></i>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </div>
                  
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="p-6 relative">
                    <h3 className="text-xl font-bold text-stone-100 mb-3 group-hover:text-teal-400 transition-colors">{project.title}</h3>
                    <p className="text-stone-400 mb-4 line-clamp-3 leading-relaxed">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className={`px-3 py-1 text-xs rounded-full border ${
                            techIndex % 2 === 0
                              ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-4 pt-4 border-t border-stone-700/50">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-stone-400 hover:text-teal-400 transition-colors duration-200 group/link"
                        >
                          <svg className="w-5 h-5 mr-2 group-hover/link:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          Code
                        </a>
                      )}
                      {project.live && (
                        <a
                          href={project.live}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-stone-400 hover:text-emerald-400 transition-colors duration-200 group/link"
                        >
                          <svg className="w-5 h-5 mr-2 group-hover/link:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';

const isRealValue = (value) => {
  if (typeof value !== 'string') return Boolean(value);
  const normalized = value.trim().toLowerCase();
  return normalized && normalized !== 'your location' && normalized !== 'your.email@example.com';
};

const safeList = (value) => (Array.isArray(value) ? value : []);
const normalizeStringList = (value) =>
  safeList(value)
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

const firstImage = (project) => {
  if (safeList(project?.images).length > 0) {
    return project.images[0];
  }
  if (project?.image) {
    return project.image;
  }
  return '';
};

const projectImagesFrom = (project) => {
  const images = safeList(project?.images).filter(isRealValue);
  if (images.length > 0) {
    return images;
  }
  return isRealValue(project?.image) ? [project.image] : [];
};

const socialLinksFrom = (social = {}, personal = {}) => {
  const links = [];
  if (isRealValue(social.github)) links.push({ label: 'GitHub', href: social.github });
  if (isRealValue(social.linkedin)) links.push({ label: 'LinkedIn', href: social.linkedin });

  const directEmail = social.email?.startsWith('mailto:') ? social.email : '';
  const emailHref = directEmail || (isRealValue(personal.email) ? `mailto:${personal.email}` : '');
  if (emailHref) links.push({ label: 'Email', href: emailHref });

  return links;
};

const isPrimaryActionTarget = (target) => {
  return Boolean(target?.closest('a, button'));
};

const scrollToSection = (sectionId) => {
  if (typeof document === 'undefined') return;
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const useSwipe = (onSwipeLeft, onSwipeRight) => {
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const onTouchStart = useCallback((e) => {
    touchStartX.current = e.changedTouches[0].screenX;
    touchEndX.current = null;
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEndX.current = e.changedTouches[0].screenX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      onSwipeLeft?.();
    } else if (distance < -minSwipeDistance) {
      onSwipeRight?.();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
};

const PublicPortfolio = () => {
  const { portfolioData } = usePortfolio();
  const { isAuthenticated } = useAuth();

  if (!portfolioData) return null;

  const personal = portfolioData.personal || {};
  const social = portfolioData.social || {};
  const skills = safeList(portfolioData.skills);
  const projects = safeList(portfolioData.projects);
  const experience = safeList(portfolioData.experience);
  const education = safeList(portfolioData.education);
  const certificates = safeList(portfolioData.certificates);
  const gallery = safeList(portfolioData.gallery).slice(0, 6);
  const galleryImages = gallery.filter((item) => isRealValue(item.url));
  const socialLinks = socialLinksFrom(social, personal);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [certificateLightboxItem, setCertificateLightboxItem] = useState(null);
  const [projectLightboxItem, setProjectLightboxItem] = useState(null);
  const [projectLightboxIndex, setProjectLightboxIndex] = useState(0);
  const [expandedProjectKey, setExpandedProjectKey] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const projectCards = projects.slice(0, 6);
  const activeLightboxItem = lightboxIndex !== null ? galleryImages[lightboxIndex] : null;

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const openCertificateLightbox = (item) => {
    setCertificateLightboxItem(item);
  };

  const closeCertificateLightbox = () => {
    setCertificateLightboxItem(null);
  };

  const openProjectLightbox = (project) => {
    const images = projectImagesFrom(project);
    if (images.length === 0) return;
    setProjectLightboxItem({
      title: project.title || 'Project',
      images,
    });
    setProjectLightboxIndex(0);
  };

  const closeProjectLightbox = () => {
    setProjectLightboxItem(null);
    setProjectLightboxIndex(0);
  };

  const showPreviousImage = () => {
    if (galleryImages.length === 0) return;
    setLightboxIndex((prev) => {
      if (prev === null) return 0;
      return (prev - 1 + galleryImages.length) % galleryImages.length;
    });
  };

  const showNextImage = () => {
    if (galleryImages.length === 0) return;
    setLightboxIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % galleryImages.length;
    });
  };

  const showPreviousProjectImage = () => {
    const totalImages = projectLightboxItem?.images?.length || 0;
    if (totalImages === 0) return;
    setProjectLightboxIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  const showNextProjectImage = () => {
    const totalImages = projectLightboxItem?.images?.length || 0;
    if (totalImages === 0) return;
    setProjectLightboxIndex((prev) => (prev + 1) % totalImages);
  };

  const toggleProjectDescription = (projectKey) => {
    setExpandedProjectKey((prev) => (prev === projectKey ? null : projectKey));
  };

  const gallerySwipe = useSwipe(showNextImage, showPreviousImage);
  const projectSwipe = useSwipe(showNextProjectImage, showPreviousProjectImage);

  useEffect(() => {
    if (lightboxIndex === null && !certificateLightboxItem && !projectLightboxItem) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeLightbox();
        closeCertificateLightbox();
        closeProjectLightbox();
      } else if (event.key === 'ArrowLeft' && lightboxIndex !== null) {
        showPreviousImage();
      } else if (event.key === 'ArrowLeft' && projectLightboxItem) {
        showPreviousProjectImage();
      } else if (event.key === 'ArrowRight' && lightboxIndex !== null) {
        showNextImage();
      } else if (event.key === 'ArrowRight' && projectLightboxItem) {
        showNextProjectImage();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, certificateLightboxItem, projectLightboxItem, galleryImages.length]);

  useEffect(() => {
    if (lightboxIndex !== null && galleryImages.length > 0 && lightboxIndex > galleryImages.length - 1) {
      setLightboxIndex(galleryImages.length - 1);
    }
    if (lightboxIndex !== null && galleryImages.length === 0) {
      setLightboxIndex(null);
    }
  }, [galleryImages.length, lightboxIndex]);

  return (
    <div className="portfolio-shell">
      <div className="portfolio-bg-orb portfolio-bg-orb-left" />
      <div className="portfolio-bg-orb portfolio-bg-orb-right" />

      <header className="portfolio-header">
        <button
          type="button"
          className="portfolio-logo portfolio-nav-button"
          onClick={() => { scrollToSection('top'); setMobileMenuOpen(false); }}
        >
          {personal.headerLogo || personal.name?.split(' ')[0] || 'Portfolio'}
        </button>
        <nav className="portfolio-nav portfolio-nav-desktop">
          <button type="button" className="portfolio-nav-button" onClick={() => scrollToSection('about')}>About</button>
          <button type="button" className="portfolio-nav-button" onClick={() => scrollToSection('skills')}>Skills</button>
          <button type="button" className="portfolio-nav-button" onClick={() => scrollToSection('projects')}>Projects</button>
          <button type="button" className="portfolio-nav-button" onClick={() => scrollToSection('contact')}>Contact</button>
        </nav>
        <button
          type="button"
          className="mobile-menu-toggle portfolio-nav-button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={`hamburger-icon ${mobileMenuOpen ? 'hamburger-open' : ''}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
      </header>

      {mobileMenuOpen && (
        <nav className="mobile-nav-drawer">
          <button type="button" className="portfolio-nav-button" onClick={() => { scrollToSection('about'); setMobileMenuOpen(false); }}>About</button>
          <button type="button" className="portfolio-nav-button" onClick={() => { scrollToSection('skills'); setMobileMenuOpen(false); }}>Skills</button>
          <button type="button" className="portfolio-nav-button" onClick={() => { scrollToSection('projects'); setMobileMenuOpen(false); }}>Projects</button>
          <button type="button" className="portfolio-nav-button" onClick={() => { scrollToSection('contact'); setMobileMenuOpen(false); }}>Contact</button>
        </nav>
      )}

      <main id="top" className="portfolio-main">
        <section className="hero-card">
          <div className="tacet-layer" aria-hidden="true">
            <div className="tacet-sweep" />
          </div>
          <div className="hero-layout">
            <p className="hero-kicker">Portfolio</p>
            <h1>{personal.name || 'Your Name'}</h1>
            <p className="hero-role">{personal.title || 'Full Stack Developer'}</p>
            <p className="hero-copy">{personal.heroBio || personal.bio || 'Building practical products with clean UX.'}</p>

            <div className="hero-cta-row">
              <button type="button" className="btn btn-primary" onClick={() => scrollToSection('projects')}>View Projects</button>
              <button type="button" className="btn btn-ghost" onClick={() => scrollToSection('contact')}>Get In Touch</button>
            </div>

            {socialLinks.length > 0 && (
              <div className="hero-links">
                {socialLinks.map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>

            <div className="stat-grid">
            <div className="stat-card scanner-card">
              <strong>{skills.length}</strong>
              <span>Skills</span>
            </div>
            <div className="stat-card scanner-card">
              <strong>{projects.length}</strong>
              <span>Projects</span>
            </div>
            <div className="stat-card scanner-card">
              <strong>{experience.length}</strong>
              <span>Experiences</span>
            </div>
          </div>
        </section>

        <section id="about" className="section-card section-about">
          <div className="about-grid">
            <aside className="about-profile-card">
              <div className="about-avatar-frame">
                {isRealValue(personal.avatar) ? (
                  <img
                    src={personal.avatar}
                    alt={personal.name || 'Profile avatar'}
                    className="profile-avatar"
                    loading="lazy"
                  />
                ) : (
                  <div className="profile-avatar profile-avatar-placeholder">
                    {(personal.name || 'P').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="about-profile-meta">
                <h3>{personal.name || 'Your Name'}</h3>
                <p>{personal.title || 'Full Stack Developer'}</p>
                {isRealValue(personal.location) && <span>{personal.location}</span>}
              </div>
            </aside>

            <div className="about-content">
              <p className="about-eyebrow">Profile Overview</p>
              <div className="section-head">
                <h2>About</h2>
              </div>
              <p className="section-copy about-copy">
                {personal.bio || 'I design and build web applications with a strong focus on product quality and user experience.'}
              </p>

              {(experience.length > 0 || education.length > 0) && (
                <div className="timeline-grid">
                  {experience.length > 0 && (
                    <article className="scanner-card">
                      <h3>Experience</h3>
                      <ul>
                        {experience.slice(0, 4).map((item, index) => (
                          <li key={item.id || `${item.role}-${index}`}>
                            <strong>{item.role || 'Role'}</strong>
                            <span>{item.company || 'Company'}</span>
                            <p>{item.period || ''}</p>
                            {normalizeStringList(item.skills).length > 0 && (
                              <div className="tag-row experience-skill-tags">
                                {normalizeStringList(item.skills).map((skill, skillIndex) => (
                                  <span key={`${skill}-${skillIndex}`}>{skill}</span>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </article>
                  )}

                  {education.length > 0 && (
                    <article className="scanner-card">
                      <h3>Education</h3>
                      <ul>
                        {education.slice(0, 4).map((item, index) => (
                          <li key={item.id || `${item.degree}-${index}`}>
                            <strong>{item.degree || 'Degree'}</strong>
                            <span>{item.institution || 'Institution'}</span>
                            <p>{item.period || ''}</p>
                          </li>
                        ))}
                      </ul>
                    </article>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {skills.length > 0 && (
          <section id="skills" className="section-card">
            <div className="section-head">
              <h2>Skills</h2>
            </div>
            <div className="chip-grid">
              {skills.map((skill, index) => (
                <div className="chip" key={skill.id || `${skill.name}-${index}`}>
                  <span>{skill.name || skill}</span>
                  {typeof skill.level === 'number' && <small>{skill.level}%</small>}
                </div>
              ))}
            </div>
          </section>
        )}

        {projectCards.length > 0 && (
          <section id="projects" className="section-card">
            <div className="section-head">
              <h2>Projects</h2>
            </div>
            <div className="project-grid">
              {projectCards.map((project, index) => {
                const imageSrc = firstImage(project);
                const projectKey = project.id || `${project.title || 'project'}-${index}`;
                const isDescriptionExpanded = expandedProjectKey === projectKey;
                return (
                  <article
                    className={`project-card scanner-card${isRealValue(imageSrc) ? ' clickable-card' : ''}`}
                    key={projectKey}
                    onClick={(event) => {
                      if (isPrimaryActionTarget(event.target)) return;
                      openProjectLightbox(project);
                    }}
                    onKeyDown={(event) => {
                      if (!isRealValue(imageSrc)) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openProjectLightbox(project);
                      }
                    }}
                    role={isRealValue(imageSrc) ? 'button' : undefined}
                    tabIndex={isRealValue(imageSrc) ? 0 : undefined}
                  >
                    <div className="project-media">
                      {imageSrc ? (
                        <img src={imageSrc} alt={project.title || 'Project image'} loading="lazy" />
                      ) : (
                        <div className="project-placeholder">No Preview</div>
                      )}
                    </div>
                    <div className="project-body">
                      <h3>{project.title || 'Untitled Project'}</h3>
                      <button
                        type="button"
                        className="project-description-toggle"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleProjectDescription(projectKey);
                        }}
                        aria-expanded={isDescriptionExpanded}
                      >
                        {isDescriptionExpanded ? 'Hide Description' : 'Show Description'}
                      </button>
                      {isDescriptionExpanded && (
                        <p>{project.description || 'No description provided.'}</p>
                      )}
                      <div className="tag-row">
                        {safeList(project.technologies).slice(0, 5).map((tech, techIndex) => (
                          <span key={`${tech}-${techIndex}`}>{tech}</span>
                        ))}
                      </div>
                      <div className="project-links">
                        {isRealValue(project.github) && (
                          <a href={project.github} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>Code</a>
                        )}
                        {isRealValue(project.live) && (
                          <a href={project.live} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>Live</a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {galleryImages.length > 0 && (
          <section className="section-card">
            <div className="section-head">
              <h2>Gallery</h2>
            </div>
            <div className="gallery-grid">
              {galleryImages.map((item, index) => (
                <figure
                  key={item.id || `${item.title}-${index}`}
                  className="gallery-item scanner-card clickable-card"
                  onClick={() => openLightbox(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openLightbox(index);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${item.title || `gallery image ${index + 1}`}`}
                >
                  <div className="gallery-media">
                    <img src={item.url} alt={item.title || 'Gallery image'} loading="lazy" />
                    <span className="gallery-open-hint">Click to view</span>
                  </div>
                  <figcaption>
                    <strong>{item.title || 'Untitled'}</strong>
                    {item.description && <p>{item.description}</p>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {certificates.length > 0 && (
          <section className="section-card">
            <div className="section-head">
              <h2>Certificates</h2>
            </div>
            <div className="certificate-list">
              {certificates.slice(0, 6).map((item, index) => (
                <article
                  className={`scanner-card${isRealValue(item.image) ? ' clickable-card' : ''}`}
                  key={item.id || `${item.title}-${index}`}
                  onClick={(event) => {
                    if (!isRealValue(item.image) || isPrimaryActionTarget(event.target)) return;
                    openCertificateLightbox(item);
                  }}
                  onKeyDown={(event) => {
                    if (!isRealValue(item.image)) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openCertificateLightbox(item);
                    }
                  }}
                  role={isRealValue(item.image) ? 'button' : undefined}
                  tabIndex={isRealValue(item.image) ? 0 : undefined}
                >
                  {isRealValue(item.image) && (
                    <div className="certificate-image-wrap">
                      <img
                        src={item.image}
                        alt={item.title || item.name || 'Certificate image'}
                        className="certificate-image"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="certificate-copy">
                    <h3>{item.title || item.name || 'Certificate'}</h3>
                    <p>{item.issuer || 'Issuer'} {item.date ? `- ${item.date}` : ''}</p>
                  </div>
                  {isRealValue(item.credentialUrl || item.url) && (
                    <a href={item.credentialUrl || item.url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>Verify</a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        <section id="contact" className="section-card section-card-contact">
          <div className="section-head">
            <h2>Contact</h2>
          </div>
          <p className="section-copy">
            Open to new opportunities, product builds, and freelance projects.
          </p>
          <div className="contact-row">
            {isRealValue(personal.email) && (
              <a href={`mailto:${personal.email}`} className="btn btn-primary">{personal.email}</a>
            )}
            {isRealValue(personal.phone) && (
              <a href={`tel:${personal.phone}`} className="btn btn-ghost">{personal.phone}</a>
            )}
          </div>
        </section>
      </main>

      {activeLightboxItem && (
        <div className="gallery-lightbox" onClick={closeLightbox} role="dialog" aria-modal="true" aria-label="Image viewer">
          <div className="gallery-lightbox-inner" onClick={(event) => event.stopPropagation()} onTouchStart={gallerySwipe.onTouchStart} onTouchMove={gallerySwipe.onTouchMove} onTouchEnd={gallerySwipe.onTouchEnd}>
            <button type="button" className="gallery-lightbox-close" onClick={closeLightbox} aria-label="Close image viewer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 6l12 12M18 6l-12 12" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {galleryImages.length > 1 && (
              <button type="button" className="gallery-lightbox-nav gallery-lightbox-prev" onClick={showPreviousImage} aria-label="Previous image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            <img
              className="gallery-lightbox-image"
              src={activeLightboxItem.url}
              alt={activeLightboxItem.title || 'Gallery image'}
            />

            {galleryImages.length > 1 && (
              <button type="button" className="gallery-lightbox-nav gallery-lightbox-next" onClick={showNextImage} aria-label="Next image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            <div className="gallery-lightbox-meta">
              <strong>{activeLightboxItem.title || 'Untitled'}</strong>
              <span>{lightboxIndex + 1} / {galleryImages.length}</span>
            </div>
          </div>
        </div>
      )}

      {certificateLightboxItem && (
        <div className="gallery-lightbox" onClick={closeCertificateLightbox} role="dialog" aria-modal="true" aria-label="Certificate viewer">
          <div className="gallery-lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="gallery-lightbox-close" onClick={closeCertificateLightbox} aria-label="Close certificate viewer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 6l12 12M18 6l-12 12" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <img
              className="gallery-lightbox-image"
              src={certificateLightboxItem.image}
              alt={certificateLightboxItem.title || certificateLightboxItem.name || 'Certificate image'}
            />

            <div className="gallery-lightbox-meta">
              <strong>{certificateLightboxItem.title || certificateLightboxItem.name || 'Certificate'}</strong>
              <span>{certificateLightboxItem.issuer || 'Certificate'}</span>
            </div>
          </div>
        </div>
      )}

      {projectLightboxItem && (
        <div className="gallery-lightbox" onClick={closeProjectLightbox} role="dialog" aria-modal="true" aria-label="Project viewer">
          <div className="gallery-lightbox-inner" onClick={(event) => event.stopPropagation()} onTouchStart={projectSwipe.onTouchStart} onTouchMove={projectSwipe.onTouchMove} onTouchEnd={projectSwipe.onTouchEnd}>
            <button type="button" className="gallery-lightbox-close" onClick={closeProjectLightbox} aria-label="Close project viewer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 6l12 12M18 6l-12 12" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {projectLightboxItem.images.length > 1 && (
              <button type="button" className="gallery-lightbox-nav gallery-lightbox-prev" onClick={showPreviousProjectImage} aria-label="Previous project image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            <img
              className="gallery-lightbox-image"
              src={projectLightboxItem.images[projectLightboxIndex]}
              alt={projectLightboxItem.title || 'Project image'}
            />

            {projectLightboxItem.images.length > 1 && (
              <button type="button" className="gallery-lightbox-nav gallery-lightbox-next" onClick={showNextProjectImage} aria-label="Next project image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            <div className="gallery-lightbox-meta">
              <strong>{projectLightboxItem.title || 'Project'}</strong>
              <span>
                {projectLightboxIndex + 1} / {projectLightboxItem.images.length}
              </span>
            </div>
          </div>
        </div>
      )}

      <footer className="portfolio-footer">
        <span>© {new Date().getFullYear()} {personal.name || 'Portfolio'}.</span>
        <a
          href={isAuthenticated ? '/admin' : '/login'}
          onClick={(event) => {
            event.preventDefault();
            window.history.pushState({}, '', isAuthenticated ? '/admin' : '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        >
          {isAuthenticated ? 'Dashboard' : 'Admin'}
        </a>
      </footer>
    </div>
  );
};

export default PublicPortfolio;

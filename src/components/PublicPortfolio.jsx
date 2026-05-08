import { useEffect, useState } from 'react';
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

const socialLinksFrom = (social = {}, personal = {}) => {
  const links = [];
  if (isRealValue(social.github)) links.push({ label: 'GitHub', href: social.github });
  if (isRealValue(social.linkedin)) links.push({ label: 'LinkedIn', href: social.linkedin });

  const directEmail = social.email?.startsWith('mailto:') ? social.email : '';
  const emailHref = directEmail || (isRealValue(personal.email) ? `mailto:${personal.email}` : '');
  if (emailHref) links.push({ label: 'Email', href: emailHref });

  return links;
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
  const [expandedProjectKey, setExpandedProjectKey] = useState(null);

  const projectCards = projects.slice(0, 6);
  const activeLightboxItem = lightboxIndex !== null ? galleryImages[lightboxIndex] : null;

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
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

  const toggleProjectDescription = (projectKey) => {
    setExpandedProjectKey((prev) => (prev === projectKey ? null : projectKey));
  };

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        showPreviousImage();
      } else if (event.key === 'ArrowRight') {
        showNextImage();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, galleryImages.length]);

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
        <a href="#top" className="portfolio-logo">
          {personal.headerLogo || personal.name?.split(' ')[0] || 'Portfolio'}
        </a>
        <nav className="portfolio-nav">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

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
              <a href="#projects" className="btn btn-primary">View Projects</a>
              <a href="#contact" className="btn btn-ghost">Get In Touch</a>
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
                  <article className="project-card scanner-card" key={projectKey}>
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
                        onClick={() => toggleProjectDescription(projectKey)}
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
                          <a href={project.github} target="_blank" rel="noopener noreferrer">Code</a>
                        )}
                        {isRealValue(project.live) && (
                          <a href={project.live} target="_blank" rel="noopener noreferrer">Live</a>
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
                <figure key={item.id || `${item.title}-${index}`} className="gallery-item scanner-card">
                  <button
                    type="button"
                    className="gallery-open-button"
                    onClick={() => openLightbox(index)}
                    aria-label={`Open ${item.title || `gallery image ${index + 1}`}`}
                  >
                    <img src={item.url} alt={item.title || 'Gallery image'} loading="lazy" />
                    <span className="gallery-open-hint">Click to view</span>
                  </button>
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
                <article className="scanner-card" key={item.id || `${item.title}-${index}`}>
                  <div>
                    <h3>{item.title || item.name || 'Certificate'}</h3>
                    <p>{item.issuer || 'Issuer'} {item.date ? `- ${item.date}` : ''}</p>
                  </div>
                  {isRealValue(item.credentialUrl || item.url) && (
                    <a href={item.credentialUrl || item.url} target="_blank" rel="noopener noreferrer">Verify</a>
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
          <div className="gallery-lightbox-inner" onClick={(event) => event.stopPropagation()}>
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

      <footer className="portfolio-footer">
        <span>© {new Date().getFullYear()} {personal.name || 'Portfolio'}.</span>
        {!isAuthenticated && <a href="#/login">Admin</a>}
      </footer>
    </div>
  );
};

export default PublicPortfolio;

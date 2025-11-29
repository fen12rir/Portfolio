import { usePortfolio } from '../context/PortfolioContext';

const About = () => {
  const { portfolioData } = usePortfolio();
  
  if (!portfolioData) return null;
  
  return (
    <section id="about" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-900/30 to-transparent"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-500/50 to-teal-500/50"></div>
            <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              About Me
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-emerald-500/50 to-emerald-500/50"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div className="relative mb-8">
                <div className="relative w-48 h-48 mx-auto md:mx-0">
                  <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-3xl blur-2xl"></div>
                  <div className="relative bg-stone-800/30 backdrop-blur-sm rounded-3xl p-4 border border-stone-700/50">
                    {portfolioData.personal.avatar ? (
                      <img
                        src={portfolioData.personal.avatar}
                        alt={portfolioData.personal.name}
                        className="w-full h-full rounded-2xl object-cover shadow-2xl"
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-stone-700/50 flex items-center justify-center">
                        <span className="text-6xl">👤</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
                <p className="text-stone-300 text-lg leading-relaxed pl-6">
                  {portfolioData.personal.bio}
                </p>
              </div>
              
              <div className="space-y-4 pl-6">
                <div className="flex items-center text-stone-400 group">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mr-4 group-hover:bg-teal-500/20 transition-colors">
                    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span>{portfolioData.personal.location}</span>
                </div>
                <div className="flex items-center text-stone-400 group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mr-4 group-hover:bg-emerald-500/20 transition-colors">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span>{portfolioData.personal.email}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              {portfolioData.experience.length > 0 && (
                <div className="relative">
                  <h3 className="text-xl font-semibold text-teal-400 mb-6 flex items-center">
                    <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                    Experience
                  </h3>
                  <div className="space-y-6 relative pl-6">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500/50 via-emerald-500/50 to-transparent"></div>
                    {portfolioData.experience.map((exp, index) => (
                      <div key={exp.id} className="relative">
                        <div className="absolute -left-9 top-2 w-3 h-3 bg-teal-500 rounded-full border-2 border-stone-900"></div>
                        <div className="bg-stone-800/50 rounded-lg p-4 border border-stone-700/50 hover:border-teal-500/50 transition-colors">
                          <h4 className="text-white font-semibold mb-1">{exp.role}</h4>
                          <p className="text-emerald-400 text-sm mb-1">{exp.company}</p>
                          <p className="text-stone-500 text-sm">{exp.period}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {portfolioData.education.length > 0 && (
                <div className="relative">
                  <h3 className="text-xl font-semibold text-emerald-400 mb-6 flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                    Education
                  </h3>
                  <div className="space-y-6 relative pl-6">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/50 via-teal-500/50 to-transparent"></div>
                    {portfolioData.education.map((edu, index) => (
                      <div key={edu.id} className="relative">
                        <div className="absolute -left-9 top-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-stone-900"></div>
                        <div className="bg-stone-800/50 rounded-lg p-4 border border-stone-700/50 hover:border-emerald-500/50 transition-colors">
                          <h4 className="text-white font-semibold mb-1">{edu.degree}</h4>
                          <p className="text-teal-400 text-sm mb-1">{edu.institution}</p>
                          <p className="text-stone-500 text-sm">{edu.period}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

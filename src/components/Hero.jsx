import { usePortfolio } from '../context/PortfolioContext';

const Hero = () => {
  const { portfolioData } = usePortfolio();
  
  if (!portfolioData) return null;
  
  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16 md:pt-20">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
          <div className="text-left md:text-left animate-slide-in-left">
            <div className="inline-block mb-6 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full">
              <span className="text-teal-400 text-sm font-medium">Available for opportunities</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-tight break-words">
              <span className="bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 bg-clip-text text-transparent animate-gradient">
                {portfolioData.personal.name.split(' ')[0]}
              </span>
              {portfolioData.personal.name.split(' ').length > 1 && (
                <>
                  <br className="hidden sm:block" />
                  <span className="text-stone-200 inline-block">
                    {portfolioData.personal.name.split(' ').slice(1).map((word, index, array) => (
                      <span key={index}>
                        {word}
                        {index < array.length - 1 && ' '}
                      </span>
                    ))}
                  </span>
                </>
              )}
            </h1>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-teal-400 mb-6 font-light">
              {portfolioData.personal.title}
            </h2>
            
            <p className="text-lg md:text-xl text-stone-400 mb-8 max-w-xl leading-relaxed">
              {portfolioData.personal.heroBio || portfolioData.personal.bio}
            </p>
            
            <div className="flex flex-wrap gap-4 mb-8 overflow-visible">
              <a
                href="#projects"
                className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-teal-500/30 hover:scale-105 transition-all duration-300 inline-block"
              >
                View My Work
              </a>
              <a
                href="#contact"
                className="px-8 py-4 border-2 border-teal-500/50 text-teal-400 rounded-lg font-semibold hover:bg-teal-500/10 hover:border-teal-400 hover:scale-105 transition-all duration-300 inline-block"
              >
                Get In Touch
              </a>
            </div>
            
            <div className="flex space-x-6">
              {portfolioData.social.github && (
                <a
                  href={portfolioData.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center bg-stone-800/50 rounded-lg text-stone-400 hover:text-teal-400 hover:bg-stone-800 transition-all duration-200 border border-stone-700/50"
                  aria-label="GitHub"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              )}
              {portfolioData.social.linkedin && (
                <a
                  href={portfolioData.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 flex items-center justify-center bg-stone-800/50 rounded-lg text-stone-400 hover:text-teal-400 hover:bg-stone-800 transition-all duration-200 border border-stone-700/50"
                  aria-label="LinkedIn"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {portfolioData.social.email && (
                <a
                  href={portfolioData.social.email}
                  className="w-12 h-12 flex items-center justify-center bg-stone-800/50 rounded-lg text-stone-400 hover:text-teal-400 hover:bg-stone-800 transition-all duration-200 border border-stone-700/50"
                  aria-label="Email"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
          
          <div className="relative animate-slide-in-right hidden md:block">
            <div className="relative w-full h-96 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-3xl blur-3xl"></div>
                  <div className="relative bg-stone-800/30 backdrop-blur-sm rounded-2xl p-6 border border-stone-700/50 shadow-2xl">
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        <span className="ml-2 text-stone-500 text-xs">portfolio.js</span>
                      </div>
                      <div className="text-stone-400">
                        <div><span className="text-teal-400">const</span> <span className="text-emerald-400">developer</span> = {'{'}</div>
                        <div className="pl-4"><span className="text-stone-500">name:</span> <span className="text-teal-300">"{portfolioData.personal.name.split(' ')[0]}"</span>,</div>
                        <div className="pl-4"><span className="text-stone-500">role:</span> <span className="text-teal-300">"{portfolioData.personal.title}"</span>,</div>
                        <div className="pl-4"><span className="text-stone-500">passion:</span> <span className="text-emerald-300">"Creating amazing things"</span>,</div>
                        <div className="pl-4"><span className="text-stone-500">status:</span> <span className="text-teal-300">"Available"</span></div>
                        <div>{'}'};</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl rotate-12 opacity-20 blur-sm animate-float"></div>
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl -rotate-12 opacity-20 blur-sm animate-float" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <a href="#about" className="text-stone-400 hover:text-teal-400 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default Hero;

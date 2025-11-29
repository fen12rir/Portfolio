import { usePortfolio } from '../context/PortfolioContext';

// Custom SVG Icon Components
const TypeScriptIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 7.303 7.303 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 5.933 5.933 0 0 1 1.77-.264zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/>
  </svg>
);

const TailwindIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,16.801,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C15.337,6.182,13.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,4.312,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"/>
  </svg>
);

const Skills = () => {
  const { portfolioData } = usePortfolio();
  
  if (!portfolioData || !portfolioData.skills) return null;
  
  const getSkillIcon = (skillName) => {
    // Normalize skill name for matching
    const normalized = skillName.trim().toLowerCase();
    
    // Check for custom SVG icons first
    if (normalized === 'typescript' || normalized === 'ts') {
      return 'CUSTOM_TYPESCRIPT';
    }
    if (normalized === 'tailwind css' || normalized === 'tailwind') {
      return 'CUSTOM_TAILWIND';
    }
    
    // Comprehensive icon mapping
    const iconMap = {
      // Frontend Frameworks & Libraries
      'react': 'fab fa-react',
      'vue': 'fab fa-vuejs',
      'vue.js': 'fab fa-vuejs',
      'angular': 'fab fa-angular',
      'next.js': 'fab fa-react',
      'nextjs': 'fab fa-react',
      'svelte': 'fab fa-js',
      'nuxt': 'fab fa-vuejs',
      'nuxt.js': 'fab fa-vuejs',
      
      // Languages
      'javascript': 'fab fa-js',
      'js': 'fab fa-js',
      'python': 'fab fa-python',
      'java': 'fab fa-java',
      'php': 'fab fa-php',
      'ruby': 'fab fa-ruby',
      'go': 'fab fa-google',
      'golang': 'fab fa-google',
      'rust': 'fab fa-rust',
      'swift': 'fab fa-swift',
      'kotlin': 'fab fa-android',
      'dart': 'fab fa-google',
      'c++': 'fas fa-code',
      'cpp': 'fas fa-code',
      'c#': 'fab fa-microsoft',
      'csharp': 'fab fa-microsoft',
      'c': 'fas fa-code',
      
      // Backend & Runtime
      'node.js': 'fab fa-node-js',
      'nodejs': 'fab fa-node-js',
      'node': 'fab fa-node-js',
      'express': 'fab fa-node-js',
      'express.js': 'fab fa-node-js',
      'django': 'fab fa-python',
      'flask': 'fab fa-python',
      'fastapi': 'fab fa-python',
      'rails': 'fab fa-ruby',
      'ruby on rails': 'fab fa-ruby',
      'laravel': 'fab fa-php',
      'spring': 'fab fa-java',
      'spring boot': 'fab fa-java',
      
      // Databases
      'mongodb': 'fas fa-database',
      'mongo': 'fas fa-database',
      'postgresql': 'fas fa-database',
      'postgres': 'fas fa-database',
      'mysql': 'fas fa-database',
      'sqlite': 'fas fa-database',
      'redis': 'fas fa-database',
      'elasticsearch': 'fab fa-searchengin',
      'cassandra': 'fas fa-database',
      'oracle': 'fas fa-database',
      'dynamodb': 'fab fa-aws',
      
      // Styling & CSS
      'css': 'fab fa-css3-alt',
      'css3': 'fab fa-css3-alt',
      'html': 'fab fa-html5',
      'html5': 'fab fa-html5',
      'sass': 'fab fa-sass',
      'scss': 'fab fa-sass',
      'less': 'fab fa-less',
      'stylus': 'fab fa-css3-alt',
      'bootstrap': 'fab fa-bootstrap',
      'material-ui': 'fab fa-google',
      'mui': 'fab fa-google',
      'chakra ui': 'fab fa-react',
      'styled-components': 'fab fa-react',
      
      // Tools & Version Control
      'git': 'fab fa-git-alt',
      'github': 'fab fa-github',
      'gitlab': 'fab fa-gitlab',
      'bitbucket': 'fab fa-bitbucket',
      'svn': 'fab fa-git-alt',
      
      // Cloud & DevOps
      'aws': 'fab fa-aws',
      'amazon web services': 'fab fa-aws',
      'azure': 'fab fa-microsoft',
      'google cloud': 'fab fa-google',
      'gcp': 'fab fa-google',
      'docker': 'fab fa-docker',
      'kubernetes': 'fab fa-docker',
      'k8s': 'fab fa-docker',
      'jenkins': 'fab fa-jenkins',
      'terraform': 'fas fa-cloud',
      'ansible': 'fas fa-server',
      'nginx': 'fas fa-server',
      'apache': 'fas fa-server',
      
      // APIs & Services
      'graphql': 'fab fa-graphql',
      'rest': 'fas fa-code',
      'rest api': 'fas fa-code',
      'firebase': 'fab fa-google',
      'supabase': 'fas fa-database',
      'vercel': 'fas fa-cloud',
      'netlify': 'fas fa-cloud',
      'heroku': 'fab fa-aws',
      
      // Package Managers
      'npm': 'fab fa-npm',
      'yarn': 'fab fa-yarn',
      'pnpm': 'fab fa-npm',
      'pip': 'fab fa-python',
      'composer': 'fab fa-php',
      
      // Testing
      'jest': 'fab fa-js',
      'mocha': 'fab fa-js',
      'cypress': 'fab fa-js',
      'selenium': 'fab fa-google',
      'jasmine': 'fab fa-js',
      
      // Mobile Development
      'react native': 'fab fa-react',
      'flutter': 'fab fa-google',
      'ionic': 'fab fa-html5',
      'xamarin': 'fab fa-microsoft',
      'android': 'fab fa-android',
      'ios': 'fab fa-apple',
      'swift': 'fab fa-swift',
      'kotlin': 'fab fa-android',
      
      // Design Tools
      'figma': 'fab fa-figma',
      'adobe': 'fab fa-adobe',
      'photoshop': 'fab fa-adobe',
      'illustrator': 'fab fa-adobe',
      'xd': 'fab fa-adobe',
      'sketch': 'fas fa-palette',
      'invision': 'fas fa-palette',
      
      // CMS & E-commerce
      'wordpress': 'fab fa-wordpress',
      'shopify': 'fab fa-shopify',
      'woocommerce': 'fab fa-wordpress',
      'drupal': 'fab fa-drupal',
      'joomla': 'fab fa-joomla',
      'magento': 'fab fa-php',
      
      // Payment & Services
      'stripe': 'fab fa-stripe',
      'paypal': 'fab fa-paypal',
      'square': 'fas fa-credit-card',
      
      // Operating Systems
      'linux': 'fab fa-linux',
      'ubuntu': 'fab fa-ubuntu',
      'windows': 'fab fa-windows',
      'macos': 'fab fa-apple',
      'mac': 'fab fa-apple',
      'apple': 'fab fa-apple',
      
      // Other Technologies
      'webpack': 'fas fa-cube',
      'vite': 'fas fa-bolt',
      'parcel': 'fas fa-cube',
      'gulp': 'fas fa-cog',
      'grunt': 'fas fa-cog',
      'jquery': 'fab fa-js',
      'redux': 'fab fa-react',
      'mobx': 'fab fa-react',
      'rxjs': 'fab fa-js',
      'three.js': 'fab fa-js',
      'threejs': 'fab fa-js',
      'd3.js': 'fab fa-js',
      'd3': 'fab fa-js',
      'socket.io': 'fab fa-node-js',
      'websocket': 'fab fa-node-js',
      'pwa': 'fab fa-html5',
      'progressive web app': 'fab fa-html5',
      'electron': 'fab fa-js',
      'tensorflow': 'fab fa-google',
      'machine learning': 'fas fa-brain',
      'ai': 'fas fa-brain',
      'blockchain': 'fab fa-bitcoin',
      'ethereum': 'fab fa-ethereum',
    };
    
    // Try exact match first
    if (iconMap[normalized]) {
      return iconMap[normalized];
    }
    
    // Try partial matches for compound names
    for (const [key, icon] of Object.entries(iconMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return icon;
      }
    }
    
    // Fallback icon
    return 'fas fa-code';
  };

  return (
    <section id="skills" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Skills & Technologies
              </span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-teal-500 to-emerald-500 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {portfolioData.skills.map((skill, index) => {
              const iconClass = getSkillIcon(skill.name);
              const isCustomIcon = iconClass.startsWith('CUSTOM_');
              
              return (
                <div
                  key={index}
                  className="group relative bg-stone-800/30 backdrop-blur-sm rounded-xl p-6 border border-stone-700/50 hover:border-teal-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 flex flex-col items-center justify-center text-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative w-full flex flex-col items-center">
                    <div className="w-16 h-16 mb-4 flex items-center justify-center bg-stone-900/50 rounded-lg p-3 group-hover:scale-110 transition-transform duration-300">
                      {isCustomIcon ? (
                        iconClass === 'CUSTOM_TYPESCRIPT' ? (
                          <TypeScriptIcon className="w-10 h-10 text-teal-400 group-hover:text-emerald-400 transition-colors duration-300" />
                        ) : iconClass === 'CUSTOM_TAILWIND' ? (
                          <TailwindIcon className="w-10 h-10 text-teal-400 group-hover:text-emerald-400 transition-colors duration-300" />
                        ) : null
                      ) : (
                        <i className={`${iconClass} text-4xl text-teal-400 group-hover:text-emerald-400 transition-colors duration-300`}></i>
                      )}
                    </div>
                    <span className="text-stone-200 font-semibold text-sm md:text-base">{skill.name}</span>
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

export default Skills;

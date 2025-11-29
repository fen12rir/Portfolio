import { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';

const Certificates = () => {
  const { portfolioData } = usePortfolio();
  const certificates = portfolioData.certificates || [];
  const [expandedCertificate, setExpandedCertificate] = useState(null);

  if (certificates.length === 0) {
    return null;
  }

  const handleCertificateClick = (certificate) => {
    setExpandedCertificate(certificate);
  };

  const closeExpanded = () => {
    setExpandedCertificate(null);
  };

  return (
    <section id="certificates" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-stone-900/30 to-transparent"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Certificates
              </span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-teal-500 to-emerald-500 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certificates.map((certificate, index) => (
              <div
                key={certificate.id || index}
                onClick={() => handleCertificateClick(certificate)}
                className="group relative bg-stone-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-stone-700/50 hover:border-teal-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/20 hover:-translate-y-2 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 to-emerald-500/0 group-hover:from-teal-500/10 group-hover:to-emerald-500/10 transition-all duration-500"></div>
                
                <div className="relative overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-stone-800 to-stone-900 relative">
                    {certificate.image ? (
                      <img
                        src={certificate.image}
                        alt={certificate.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-certificate text-6xl text-stone-700"></i>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 relative">
                  <h3 className="text-xl font-bold text-stone-100 mb-3 group-hover:text-teal-400 transition-colors">{certificate.title}</h3>
                  {certificate.issuer && (
                    <p className="text-teal-400 mb-2 font-semibold">{certificate.issuer}</p>
                  )}
                  {certificate.date && (
                    <p className="text-stone-500 text-sm mb-4">{certificate.date}</p>
                  )}
                  {certificate.description && (
                    <p className="text-stone-400 mb-4 line-clamp-3 leading-relaxed">{certificate.description}</p>
                  )}
                  
                  {certificate.credentialId && (
                    <div className="mb-4">
                      <span className="text-xs text-stone-500">Credential ID: </span>
                      <span className="text-xs text-stone-400 font-mono">{certificate.credentialId}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-4 pt-4 border-t border-stone-700/50">
                    {certificate.credentialUrl && (
                      <a
                        href={certificate.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-stone-400 hover:text-teal-400 transition-colors duration-200 group/link"
                      >
                        <svg className="w-5 h-5 mr-2 group-hover/link:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Certificate
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Certificate Modal */}
      {expandedCertificate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={closeExpanded}
        >
          <div
            className="relative bg-stone-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-stone-700/50 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeExpanded}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-stone-800/80 hover:bg-red-500/20 border border-stone-700/50 hover:border-red-500/50 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-400 transition-all duration-200"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Certificate Image */}
            {expandedCertificate.image && (
              <div className="relative w-full aspect-video bg-gradient-to-br from-stone-800 to-stone-900">
                <img
                  src={expandedCertificate.image}
                  alt={expandedCertificate.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Certificate Details */}
            <div className="p-6 md:p-8">
              <h3 className="text-3xl md:text-4xl font-bold text-stone-100 mb-4">
                {expandedCertificate.title}
              </h3>
              
              {expandedCertificate.issuer && (
                <p className="text-xl text-teal-400 mb-3 font-semibold">
                  {expandedCertificate.issuer}
                </p>
              )}
              
              {expandedCertificate.date && (
                <p className="text-stone-400 mb-6">
                  <span className="text-stone-500">Issued: </span>
                  {expandedCertificate.date}
                </p>
              )}
              
              {expandedCertificate.description && (
                <div className="mb-6">
                  <h4 className="text-stone-300 font-semibold mb-2">Description</h4>
                  <p className="text-stone-400 leading-relaxed whitespace-pre-line">
                    {expandedCertificate.description}
                  </p>
                </div>
              )}
              
              {expandedCertificate.credentialId && (
                <div className="mb-6 p-4 bg-stone-800/50 rounded-lg border border-stone-700/50">
                  <h4 className="text-stone-300 font-semibold mb-2">Credential ID</h4>
                  <p className="text-stone-400 font-mono text-sm break-all">
                    {expandedCertificate.credentialId}
                  </p>
                </div>
              )}
              
              {expandedCertificate.credentialUrl && (
                <div className="flex gap-4 pt-4 border-t border-stone-700/50">
                  <a
                    href={expandedCertificate.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Verify Certificate
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </section>
  );
};

export default Certificates;


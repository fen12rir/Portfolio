import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPortfolioData, getPortfolioDataAsync, savePortfolioData, resetPortfolioData, clearCache } from '../utils/storage';

const AdminDashboard = () => {
  const { logout, setPassword } = useAuth();
  const [data, setData] = useState(getPortfolioData());
  const [activeTab, setActiveTab] = useState('personal');
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    // Load data asynchronously to ensure fresh data from API
    const loadData = async () => {
      const portfolioData = await getPortfolioDataAsync();
      setData(portfolioData);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      // Clean up social links to only include allowed ones
      const allowedSocialKeys = ['github', 'linkedin', 'email'];
      const cleanedSocial = {};
      allowedSocialKeys.forEach(key => {
        if (data.social[key]) {
          cleanedSocial[key] = data.social[key];
        }
      });
      
      const cleanedData = {
        ...data,
        social: cleanedSocial
      };
      
      // Show saving state
      setSaved(false);
      
      const result = await savePortfolioData(cleanedData);
      
      if (result && result.success !== false) {
        setSaved(true);
        // Clear cache and reload fresh data from server
        clearCache();
        const freshData = await getPortfolioDataAsync();
        setData(freshData);
        // Trigger refresh event for PortfolioContext
        window.dispatchEvent(new Event('portfolioDataUpdated'));
        setTimeout(() => {
          setSaved(false);
        }, 1500);
      } else {
        const errorMsg = result?.error || result?.message || 'Failed to save data. Please try again.';
        console.error('Save failed:', errorMsg, result);
        
        // Special handling for 413 (Payload Too Large)
        if (errorMsg.includes('413') || errorMsg.includes('too large') || errorMsg.includes('PAYLOAD')) {
          alert('Data is too large to save. Please reduce image sizes or remove some images. Images are being compressed automatically, but you may need to use smaller files.');
        } else {
          alert(errorMsg);
        }
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert(`Error saving data: ${error.message}`);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all data to defaults? This cannot be undone.')) {
      await resetPortfolioData();
      clearCache();
      const freshData = await getPortfolioDataAsync();
      setData(freshData);
      window.location.reload();
    }
  };

  const handlePasswordChange = () => {
    if (newPassword.length >= 6) {
      setPassword(newPassword);
      setNewPassword('');
      setShowPasswordChange(false);
      alert('Password updated successfully!');
    } else {
      alert('Password must be at least 6 characters long');
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updatePersonal('avatar', reader.result);
      };
      reader.onerror = () => {
        alert('Error reading file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const updatePersonal = (field, value) => {
    setData({ ...data, personal: { ...data.personal, [field]: value } });
  };

  const updateSocial = (field, value) => {
    setData({ ...data, social: { ...data.social, [field]: value } });
  };

  const updateSkill = (index, field, value) => {
    const skills = [...data.skills];
    skills[index] = { ...skills[index], [field]: value };
    setData({ ...data, skills });
  };

  const addSkill = () => {
    setData({ ...data, skills: [...data.skills, { name: '' }] });
  };

  const removeSkill = (index) => {
    const skills = data.skills.filter((_, i) => i !== index);
    setData({ ...data, skills });
  };

  const updateProject = (index, field, value) => {
    const projects = [...data.projects];
    projects[index] = { ...projects[index], [field]: value };
    setData({ ...data, projects });
  };

  const addProject = () => {
    const newId = Math.max(...data.projects.map(p => p.id || 0), 0) + 1;
    setData({
      ...data,
      projects: [
        ...data.projects,
        {
          id: newId,
          title: '',
          description: '',
          image: '',
          technologies: [],
          github: '',
          live: '',
        },
      ],
    });
  };

  const removeProject = (index) => {
    const projects = data.projects.filter((_, i) => i !== index);
    setData({ ...data, projects });
  };

  const updateProjectTech = (projectIndex, techIndex, value) => {
    const projects = [...data.projects];
    const techs = [...projects[projectIndex].technologies];
    techs[techIndex] = value;
    projects[projectIndex].technologies = techs;
    setData({ ...data, projects });
  };

  const addProjectTech = (projectIndex) => {
    const projects = [...data.projects];
    projects[projectIndex].technologies = [...projects[projectIndex].technologies, ''];
    setData({ ...data, projects });
  };

  const removeProjectTech = (projectIndex, techIndex) => {
    const projects = [...data.projects];
    projects[projectIndex].technologies = projects[projectIndex].technologies.filter((_, i) => i !== techIndex);
    setData({ ...data, projects });
  };

  const updateExperience = (index, field, value) => {
    const experience = [...data.experience];
    experience[index] = { ...experience[index], [field]: value };
    setData({ ...data, experience });
  };

  const addExperience = () => {
    const newId = Math.max(...data.experience.map(e => e.id || 0), 0) + 1;
    setData({
      ...data,
      experience: [
        ...data.experience,
        { id: newId, role: '', company: '', period: '', description: '' },
      ],
    });
  };

  const removeExperience = (index) => {
    const experience = data.experience.filter((_, i) => i !== index);
    setData({ ...data, experience });
  };

  const updateEducation = (index, field, value) => {
    const education = [...data.education];
    education[index] = { ...education[index], [field]: value };
    setData({ ...data, education });
  };

  const addEducation = () => {
    const newId = Math.max(...data.education.map(e => e.id || 0), 0) + 1;
    setData({
      ...data,
      education: [
        ...data.education,
        { id: newId, degree: '', institution: '', period: '' },
      ],
    });
  };

  const removeEducation = (index) => {
    const education = data.education.filter((_, i) => i !== index);
    setData({ ...data, education });
  };

  const updateGallery = (index, field, value) => {
    const gallery = [...(data.gallery || [])];
    gallery[index] = { ...gallery[index], [field]: value };
    setData({ ...data, gallery });
  };

  const addGalleryItem = () => {
    const newId = Math.max(...(data.gallery || []).map(g => g.id || 0), 0) + 1;
    setData({
      ...data,
      gallery: [
        ...(data.gallery || []),
        { id: newId, title: '', description: '', url: '' },
      ],
    });
  };

  const removeGalleryItem = (index) => {
    const gallery = (data.gallery || []).filter((_, i) => i !== index);
    setData({ ...data, gallery });
  };

  const handleGalleryImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateGallery(index, 'url', reader.result);
      };
      reader.onerror = () => {
        alert('Error reading file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const updateCertificate = (index, field, value) => {
    const certificates = [...(data.certificates || [])];
    certificates[index] = { ...certificates[index], [field]: value };
    setData({ ...data, certificates });
  };

  const addCertificate = () => {
    const newId = Math.max(...(data.certificates || []).map(c => c.id || 0), 0) + 1;
    setData({
      ...data,
      certificates: [
        ...(data.certificates || []),
        {
          id: newId,
          title: '',
          issuer: '',
          date: '',
          description: '',
          image: '',
          credentialId: '',
          credentialUrl: '',
        },
      ],
    });
  };

  const removeCertificate = (index) => {
    const certificates = (data.certificates || []).filter((_, i) => i !== index);
    setData({ ...data, certificates });
  };

  // Reorder functions
  const reorderProjects = (fromIndex, toIndex) => {
    const projects = [...data.projects];
    const [removed] = projects.splice(fromIndex, 1);
    projects.splice(toIndex, 0, removed);
    setData({ ...data, projects });
  };

  const reorderCertificates = (fromIndex, toIndex) => {
    const certificates = [...(data.certificates || [])];
    const [removed] = certificates.splice(fromIndex, 1);
    certificates.splice(toIndex, 0, removed);
    setData({ ...data, certificates });
  };

  const reorderGallery = (fromIndex, toIndex) => {
    const gallery = [...(data.gallery || [])];
    const [removed] = gallery.splice(fromIndex, 1);
    gallery.splice(toIndex, 0, removed);
    setData({ ...data, gallery });
  };

  // Drag handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex, type) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    if (type === 'project') {
      reorderProjects(draggedIndex, dropIndex);
    } else if (type === 'certificate') {
      reorderCertificates(draggedIndex, dropIndex);
    } else if (type === 'gallery') {
      reorderGallery(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCertificateImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateCertificate(index, 'image', reader.result);
      };
      reader.onerror = () => {
        alert('Error reading file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProjectImageUpload = (index, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image "${file.name}" size must be less than 5MB`);
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" is not an image file`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const project = data.projects[index];
        const currentImages = project.images || (project.image ? [project.image] : []);
        const newImages = [...currentImages, reader.result];
        updateProject(index, 'images', newImages);
        // Remove old 'image' field if it exists
        if (project.image && !project.images) {
          const updatedProject = { ...project, images: newImages };
          delete updatedProject.image;
          const updatedProjects = [...data.projects];
          updatedProjects[index] = updatedProject;
          setData({ ...data, projects: updatedProjects });
        }
      };
      reader.onerror = () => {
        alert('Error reading file. Please try again.');
      };
      reader.readAsDataURL(file);
    });
  };

  const removeProjectImage = (projectIndex, imageIndex) => {
    const project = data.projects[projectIndex];
    const images = project.images || (project.image ? [project.image] : []);
    const newImages = images.filter((_, idx) => idx !== imageIndex);
    updateProject(projectIndex, 'images', newImages);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
    { id: 'social', label: 'Social Links' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'certificates', label: 'Certificates' },
  ];

  return (
    <div className="min-h-screen bg-stone-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl border border-stone-700/50 shadow-2xl">
          <div className="p-6 border-b border-stone-700/50 flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <div className="flex gap-4">
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="px-4 py-2 bg-stone-700/50 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
              >
                Change Password
              </button>
              <button
                onClick={() => {
                  logout();
                  window.location.hash = '#/';
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {showPasswordChange && (
            <div className="p-6 border-b border-stone-700/50 bg-stone-800/30">
              <div className="flex gap-4">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="flex-1 px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                />
                <button
                  onClick={handlePasswordChange}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 bg-stone-700/50 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex">
            <div className="w-64 border-r border-stone-700/50 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'text-stone-400 hover:text-stone-300 hover:bg-stone-800/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 p-6">
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-stone-100">Personal Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-stone-300 mb-2">Name</label>
                      <input
                        type="text"
                        value={data.personal.name}
                        onChange={(e) => updatePersonal('name', e.target.value)}
                        className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-300 mb-2">Header Logo/Name</label>
                      <input
                        type="text"
                        value={data.personal.headerLogo || ''}
                        onChange={(e) => updatePersonal('headerLogo', e.target.value)}
                        className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                        placeholder="Leave empty to use first name"
                      />
                      <p className="text-stone-500 text-xs mt-1">This text appears in the header logo. If empty, uses the first name.</p>
                    </div>
                    <div>
                      <label className="block text-stone-300 mb-2">Title</label>
                      <input
                        type="text"
                        value={data.personal.title}
                        onChange={(e) => updatePersonal('title', e.target.value)}
                        className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-300 mb-2">Location</label>
                      <input
                        type="text"
                        value={data.personal.location}
                        onChange={(e) => updatePersonal('location', e.target.value)}
                        className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={data.personal.email}
                        onChange={(e) => updatePersonal('email', e.target.value)}
                        className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-300 mb-2">Phone</label>
                      <input
                        type="text"
                        value={data.personal.phone}
                        onChange={(e) => updatePersonal('phone', e.target.value)}
                        className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-300 mb-2">Hero Bio (Short Description)</label>
                      <textarea
                        value={data.personal.heroBio || ''}
                        onChange={(e) => updatePersonal('heroBio', e.target.value)}
                        rows="3"
                        className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                        placeholder="Short bio displayed in the hero section"
                      />
                      <p className="text-stone-500 text-xs mt-1">This appears in the hero section below your name and title.</p>
                    </div>
                    <div>
                      <label className="block text-stone-300 mb-2">About Bio (Full Description)</label>
                      <textarea
                        value={data.personal.bio}
                        onChange={(e) => updatePersonal('bio', e.target.value)}
                        rows="4"
                        className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                        placeholder="Full bio displayed in the About section"
                      />
                      <p className="text-stone-500 text-xs mt-1">This appears in the About section next to your avatar.</p>
                    </div>
                    <div>
                      <label className="block text-stone-300 mb-2">Avatar Image</label>
                      <div className="space-y-4">
                        {data.personal.avatar && (
                          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-stone-700/50">
                            <img
                              src={data.personal.avatar}
                              alt="Avatar preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            id="avatar-upload"
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="inline-block px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-400 rounded-lg cursor-pointer transition-colors"
                          >
                            Upload Image
                          </label>
                          {data.personal.avatar && (
                            <button
                              onClick={() => updatePersonal('avatar', '')}
                              className="ml-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <p className="text-stone-500 text-sm">Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-stone-100">Social Links</h2>
                  <div className="space-y-4">
                    {['github', 'linkedin', 'email'].map((key) => (
                      <div key={key}>
                        <label className="block text-stone-300 mb-2 capitalize">{key}</label>
                        <input
                          type="url"
                          value={data.social[key] || ''}
                          onChange={(e) => updateSocial(key, e.target.value)}
                          className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-stone-100">Skills</h2>
                    <button
                      onClick={addSkill}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                    >
                      Add Skill
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.skills.map((skill, index) => (
                      <div key={index} className="p-4 bg-stone-800/30 rounded-lg border border-stone-700/50">
                        <div className="flex gap-4 mb-4">
                          <div className="flex-1">
                            <label className="block text-stone-300 mb-2">Skill Name</label>
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => updateSkill(index, 'name', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                            />
                          </div>
                          <button
                            onClick={() => removeSkill(index)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors self-end"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-stone-100">Projects</h2>
                    <button
                      onClick={addProject}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                    >
                      Add Project
                    </button>
                  </div>
                  <div className="space-y-6">
                    {data.projects.map((project, index) => (
                      <div
                        key={project.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index, 'project')}
                        onDragEnd={handleDragEnd}
                        className={`p-4 bg-stone-800/30 rounded-lg border border-stone-700/50 cursor-move transition-all ${
                          draggedIndex === index 
                            ? 'opacity-50 border-teal-500' 
                            : dragOverIndex === index
                            ? 'border-teal-500 bg-teal-500/10'
                            : 'hover:border-teal-500/50'
                        }`}
                        onDragLeave={handleDragLeave}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-stone-500 cursor-grab active:cursor-grabbing">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-stone-200">Project {index + 1}</h3>
                          </div>
                          <button
                            onClick={() => removeProject(index)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-stone-300 mb-2">Title</label>
                            <input
                              type="text"
                              value={project.title}
                              onChange={(e) => updateProject(index, 'title', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Description</label>
                            <textarea
                              value={project.description}
                              onChange={(e) => updateProject(index, 'description', e.target.value)}
                              rows="3"
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Project Images</label>
                            <div className="space-y-4">
                              {(project.images || (project.image ? [project.image] : [])).map((img, imgIndex) => (
                                <div key={imgIndex} className="relative w-48 h-32 rounded-lg overflow-hidden border border-stone-700/50 group">
                                  <img
                                    src={img}
                                    alt={`${project.title || 'Project'} - Image ${imgIndex + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={() => removeProjectImage(index, imgIndex)}
                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove image"
                                  >
                                    ×
                                  </button>
                                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-stone-900/70 text-stone-300 text-xs rounded">
                                    Image {imgIndex + 1}
                                  </div>
                                </div>
                              ))}
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={(e) => handleProjectImageUpload(index, e)}
                                  className="hidden"
                                  id={`project-upload-${index}`}
                                />
                                <label
                                  htmlFor={`project-upload-${index}`}
                                  className="inline-block px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-400 rounded-lg cursor-pointer transition-colors"
                                >
                                  + Add Images
                                </label>
                              </div>
                              <p className="text-stone-500 text-sm">Max file size: 5MB per image. Supported formats: JPG, PNG, GIF, WebP. You can upload multiple images at once.</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">GitHub URL</label>
                            <input
                              type="url"
                              value={project.github}
                              onChange={(e) => updateProject(index, 'github', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Live Demo URL</label>
                            <input
                              type="url"
                              value={project.live}
                              onChange={(e) => updateProject(index, 'live', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Technologies</label>
                            <div className="space-y-2">
                              {project.technologies.map((tech, techIndex) => (
                                <div key={techIndex} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={tech}
                                    onChange={(e) => updateProjectTech(index, techIndex, e.target.value)}
                                    className="flex-1 px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                                    placeholder="Technology name"
                                  />
                                  <button
                                    onClick={() => removeProjectTech(index, techIndex)}
                                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addProjectTech(index)}
                                className="px-4 py-2 bg-stone-700/50 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
                              >
                                + Add Technology
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'certificates' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-stone-100">Certificates</h2>
                    <button
                      onClick={addCertificate}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                    >
                      Add Certificate
                    </button>
                  </div>
                  <div className="space-y-6">
                    {(data.certificates || []).map((certificate, index) => (
                      <div
                        key={certificate.id || index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index, 'certificate')}
                        onDragEnd={handleDragEnd}
                        className={`p-4 bg-stone-800/30 rounded-lg border border-stone-700/50 cursor-move transition-all ${
                          draggedIndex === index 
                            ? 'opacity-50 border-teal-500' 
                            : dragOverIndex === index
                            ? 'border-teal-500 bg-teal-500/10'
                            : 'hover:border-teal-500/50'
                        }`}
                        onDragLeave={handleDragLeave}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-stone-500 cursor-grab active:cursor-grabbing">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-stone-200">Certificate {index + 1}</h3>
                          </div>
                          <button
                            onClick={() => removeCertificate(index)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-stone-300 mb-2">Title</label>
                            <input
                              type="text"
                              value={certificate.title || ''}
                              onChange={(e) => updateCertificate(index, 'title', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                              placeholder="Certificate title"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Issuer</label>
                            <input
                              type="text"
                              value={certificate.issuer || ''}
                              onChange={(e) => updateCertificate(index, 'issuer', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                              placeholder="Issuing organization"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Date</label>
                            <input
                              type="text"
                              value={certificate.date || ''}
                              onChange={(e) => updateCertificate(index, 'date', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                              placeholder="e.g., January 2024"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Description</label>
                            <textarea
                              value={certificate.description || ''}
                              onChange={(e) => updateCertificate(index, 'description', e.target.value)}
                              rows="3"
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                              placeholder="Certificate description"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Credential ID</label>
                            <input
                              type="text"
                              value={certificate.credentialId || ''}
                              onChange={(e) => updateCertificate(index, 'credentialId', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                              placeholder="Credential ID or verification code"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Credential URL</label>
                            <input
                              type="url"
                              value={certificate.credentialUrl || ''}
                              onChange={(e) => updateCertificate(index, 'credentialUrl', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                              placeholder="Link to verify/view certificate"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Certificate Image</label>
                            <div className="space-y-4">
                              {certificate.image && (
                                <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-stone-700/50">
                                  <img
                                    src={certificate.image}
                                    alt={certificate.title || 'Certificate preview'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleCertificateImageUpload(index, e)}
                                  className="hidden"
                                  id={`certificate-upload-${index}`}
                                />
                                <label
                                  htmlFor={`certificate-upload-${index}`}
                                  className="inline-block px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-400 rounded-lg cursor-pointer transition-colors"
                                >
                                  {certificate.image ? 'Change Image' : 'Upload Image'}
                                </label>
                                {certificate.image && (
                                  <button
                                    onClick={() => updateCertificate(index, 'image', '')}
                                    className="ml-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-colors"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <p className="text-stone-500 text-sm">Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-stone-100">Experience</h2>
                    <button
                      onClick={addExperience}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                    >
                      Add Experience
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.experience.map((exp, index) => (
                      <div key={exp.id} className="p-4 bg-stone-800/30 rounded-lg border border-stone-700/50">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-stone-200">Experience {index + 1}</h3>
                          <button
                            onClick={() => removeExperience(index)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-stone-300 mb-2">Role</label>
                            <input
                              type="text"
                              value={exp.role}
                              onChange={(e) => updateExperience(index, 'role', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Company</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(index, 'company', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Period</label>
                            <input
                              type="text"
                              value={exp.period}
                              onChange={(e) => updateExperience(index, 'period', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                              placeholder="e.g., 2022 - Present"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Description</label>
                            <textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(index, 'description', e.target.value)}
                              rows="3"
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'education' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-stone-100">Education</h2>
                    <button
                      onClick={addEducation}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                    >
                      Add Education
                    </button>
                  </div>
                  <div className="space-y-4">
                    {data.education.map((edu, index) => (
                      <div key={edu.id} className="p-4 bg-stone-800/30 rounded-lg border border-stone-700/50">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-stone-200">Education {index + 1}</h3>
                          <button
                            onClick={() => removeEducation(index)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-stone-300 mb-2">Degree</label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Institution</label>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Period</label>
                            <input
                              type="text"
                              value={edu.period}
                              onChange={(e) => updateEducation(index, 'period', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                              placeholder="e.g., 2016 - 2020"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-stone-100">Image Gallery</h2>
                    <button
                      onClick={addGalleryItem}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                    >
                      Add Image
                    </button>
                  </div>
                  <div className="space-y-6">
                    {(data.gallery || []).map((item, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index, 'gallery')}
                        onDragEnd={handleDragEnd}
                        className={`p-4 bg-stone-800/30 rounded-lg border border-stone-700/50 cursor-move transition-all ${
                          draggedIndex === index 
                            ? 'opacity-50 border-teal-500' 
                            : dragOverIndex === index
                            ? 'border-teal-500 bg-teal-500/10'
                            : 'hover:border-teal-500/50'
                        }`}
                        onDragLeave={handleDragLeave}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-stone-500 cursor-grab active:cursor-grabbing">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-stone-200">Gallery Item {index + 1}</h3>
                          </div>
                          <button
                            onClick={() => removeGalleryItem(index)}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-stone-300 mb-2">Title</label>
                            <input
                              type="text"
                              value={item.title || ''}
                              onChange={(e) => updateGallery(index, 'title', e.target.value)}
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                              placeholder="Image title"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Description</label>
                            <textarea
                              value={item.description || ''}
                              onChange={(e) => updateGallery(index, 'description', e.target.value)}
                              rows="3"
                              className="w-full px-4 py-2 bg-stone-800/50 border border-stone-700/50 rounded-lg text-stone-100 focus:outline-none focus:border-teal-500/50"
                              placeholder="Describe what this image is about"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-300 mb-2">Image</label>
                            <div className="space-y-4">
                              {item.url && (
                                <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-stone-700/50">
                                  <img
                                    src={item.url}
                                    alt={item.title || 'Gallery preview'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleGalleryImageUpload(index, e)}
                                  className="hidden"
                                  id={`gallery-upload-${index}`}
                                />
                                <label
                                  htmlFor={`gallery-upload-${index}`}
                                  className="inline-block px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-400 rounded-lg cursor-pointer transition-colors"
                                >
                                  {item.url ? 'Change Image' : 'Upload Image'}
                                </label>
                                {item.url && (
                                  <button
                                    onClick={() => updateGallery(index, 'url', '')}
                                    className="ml-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg transition-colors"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <p className="text-stone-500 text-sm">Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-stone-700/50 flex justify-between items-center bg-stone-800/30">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
            <div className="flex gap-4">
              {saved && (
                <span className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded-lg">Saved!</span>
              )}
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;


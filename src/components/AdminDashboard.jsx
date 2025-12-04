import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPortfolioData, getCorePortfolioData, getPortfolioSections, savePortfolioData, resetPortfolioData, clearCache } from '../utils/storage';

const AdminDashboard = () => {
  const { logout, setPassword } = useAuth();
  const defaultData = getPortfolioData();
  const [data, setData] = useState({
    personal: defaultData.personal || {},
    social: defaultData.social || {},
    skills: defaultData.skills || [],
    projects: defaultData.projects || [],
    experience: defaultData.experience || [],
    education: defaultData.education || [],
    certificates: defaultData.certificates || [],
    gallery: defaultData.gallery || []
  });
  const [originalData, setOriginalData] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [saved, setSaved] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [loadingSections, setLoadingSections] = useState(new Set());
  const loadedSectionsRef = useRef(new Set());
  const mountedRef = useRef(true);

  const tabToSectionMap = {
    personal: ['personal', 'social'],
    social: ['personal', 'social'],
    experience: ['experience'],
    education: ['education'],
    gallery: ['gallery'],
    skills: ['skills'],
    projects: ['projects'],
    certificates: ['certificates']
  };

  useEffect(() => {
    mountedRef.current = true;
    loadCoreData();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab && loadedSectionsRef.current.has(activeTab)) {
      return;
    }
    loadTabData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!originalData && data && (data.personal || data.social)) {
      setOriginalData(JSON.parse(JSON.stringify(data)));
    }
  }, [data, originalData]);

  const loadCoreData = async () => {
    try {
      const coreResult = await getCorePortfolioData(true);
      
      if (!mountedRef.current) return;
      
      if (coreResult && coreResult.data) {
        setData(prev => ({
          ...prev,
          personal: coreResult.data.personal || prev.personal,
          social: coreResult.data.social || prev.social
        }));
        
        loadedSectionsRef.current.add('personal');
        loadedSectionsRef.current.add('social');
        
        if (import.meta.env.DEV) {
          console.log('✅ AdminDashboard core data loaded');
        }
      }
    } catch (error) {
      console.error('Error loading core data:', error);
    }
  };

  const loadTabData = async (tab) => {
    if (loadedSectionsRef.current.has(tab)) {
      return;
    }

    const sections = tabToSectionMap[tab];
    if (!sections) return;

    const sectionsToLoad = sections.filter(section => {
      if (section === 'personal' || section === 'social') {
        return !loadedSectionsRef.current.has(section);
      }
      return !loadedSectionsRef.current.has(section);
    });

    if (sectionsToLoad.length === 0) {
      loadedSectionsRef.current.add(tab);
      return;
    }

    setLoadingSections(prev => {
      const newSet = new Set(prev);
      sectionsToLoad.forEach(s => newSet.add(s));
      return newSet;
    });

    try {
      const coreSections = sectionsToLoad.filter(s => s === 'personal' || s === 'social');
      const otherSections = sectionsToLoad.filter(s => s !== 'personal' && s !== 'social');

      let updates = {};

      if (coreSections.length > 0) {
        const coreResult = await getCorePortfolioData(true);
        if (coreResult && coreResult.data) {
          if (coreResult.data.personal) updates.personal = coreResult.data.personal;
          if (coreResult.data.social) updates.social = coreResult.data.social;
          coreSections.forEach(s => loadedSectionsRef.current.add(s));
        }
      }

      if (otherSections.length > 0) {
        const sectionsData = await getPortfolioSections(otherSections, true);
        if (sectionsData && Object.keys(sectionsData).length > 0) {
          Object.keys(sectionsData).forEach(section => {
            updates[section] = sectionsData[section] || [];
            loadedSectionsRef.current.add(section);
          });
        }
      }

      if (!mountedRef.current) return;

      if (Object.keys(updates).length > 0) {
        setData(prev => {
          const newData = { ...prev, ...updates };
          if (!originalData) {
            setOriginalData(JSON.parse(JSON.stringify(newData)));
          } else {
            setOriginalData(prevOriginal => {
              const updatedOriginal = JSON.parse(JSON.stringify(prevOriginal));
              Object.keys(updates).forEach(key => {
                updatedOriginal[key] = newData[key];
              });
              return updatedOriginal;
            });
          }
          return newData;
        });
      }
      
      loadedSectionsRef.current.add(tab);

      if (import.meta.env.DEV) {
        console.log(`✅ AdminDashboard loaded tab: ${tab}`, {
          sections: sectionsToLoad
        });
      }
    } catch (error) {
      console.error(`Error loading tab data for ${tab}:`, error);
    } finally {
      setLoadingSections(prev => {
        const newSet = new Set(prev);
        sectionsToLoad.forEach(s => newSet.delete(s));
        return newSet;
      });
    }
  };

  // Helper function to remove base64 images that haven't changed (keep only new/changed images)
  const optimizeImageData = (data, original) => {
    const cleaned = JSON.parse(JSON.stringify(data)); // Deep clone
    
    // Handle personal avatar - only keep if it's new base64 or a URL
    if (cleaned.personal?.avatar) {
      if (cleaned.personal.avatar.startsWith('data:image')) {
        // It's base64 - check if it's different from original
        if (original?.personal?.avatar === cleaned.personal.avatar) {
          // Same as original, remove it (server will keep existing)
          delete cleaned.personal.avatar;
        }
        // Otherwise keep it (it's a new image)
      }
      // If it's a URL, keep it
    }
    
    // Handle projects - only keep base64 if it's new
    if (cleaned.projects && Array.isArray(cleaned.projects)) {
      cleaned.projects = cleaned.projects.map((project, index) => {
        if (project.image && project.image.startsWith('data:image')) {
          // It's base64 - check if it's different from original
          const originalProject = original?.projects?.[index];
          if (originalProject?.image === project.image) {
            // Same as original, remove base64 (server keeps existing)
            return { ...project, image: originalProject.image.startsWith('data:') ? '' : originalProject.image };
          }
          // It's a new image, keep it but warn if too large
          const imageSize = project.image.length;
          if (imageSize > 500000) { // > 500KB
            console.warn(`Large image detected in project ${index}: ${(imageSize / 1024).toFixed(2)}KB`);
          }
        }
        return project;
      });
    }
    
    // Handle gallery - only keep base64 if it's new
    if (cleaned.gallery && Array.isArray(cleaned.gallery)) {
      cleaned.gallery = cleaned.gallery.map((item, index) => {
        if (item.url && item.url.startsWith('data:image')) {
          // It's base64 - check if it's different from original
          const originalItem = original?.gallery?.[index];
          if (originalItem?.url === item.url) {
            // Same as original, remove base64 (server keeps existing)
            return { ...item, url: originalItem.url.startsWith('data:') ? '' : originalItem.url };
          }
          // It's a new image, keep it but warn if too large
          const imageSize = item.url.length;
          if (imageSize > 500000) { // > 500KB
            console.warn(`Large image detected in gallery ${index}: ${(imageSize / 1024).toFixed(2)}KB`);
          }
        }
        return item;
      });
    }
    
    return cleaned;
  };

  // Helper function to compute only changed fields
  const getChangedFields = (current, original) => {
    if (!original) {
      // First save - optimize images but send all data
      return optimizeImageData(current, null);
    }
    
    const changes = {};
    
    // Compare top-level sections
    const sections = ['personal', 'social', 'skills', 'projects', 'experience', 'education', 'certificates', 'gallery'];
    
    sections.forEach(section => {
      if (!current[section]) return;
      
      // For sections with images, compare without base64 data (to detect changes)
      let currentSection = current[section];
      let originalSection = original[section];
      
      if (section === 'personal' || section === 'projects' || section === 'gallery') {
        // Create copies without base64 for comparison
        const currentCopy = JSON.parse(JSON.stringify(currentSection));
        const originalCopy = JSON.parse(JSON.stringify(originalSection || {}));
        
        // Normalize base64 images for comparison (treat all base64 as same for comparison)
        const normalizeForComparison = (obj) => {
          if (typeof obj !== 'object' || obj === null) return obj;
          if (Array.isArray(obj)) {
            return obj.map(normalizeForComparison);
          }
          const normalized = {};
          for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'string' && obj[key].startsWith('data:image')) {
              normalized[key] = '[BASE64_IMAGE]'; // Placeholder for comparison
            } else {
              normalized[key] = normalizeForComparison(obj[key]);
            }
          }
          return normalized;
        };
        
        const currentNormalized = normalizeForComparison(currentCopy);
        const originalNormalized = normalizeForComparison(originalCopy);
        
        const currentArray = Array.isArray(currentNormalized) ? currentNormalized : [];
        const originalArray = Array.isArray(originalNormalized) ? originalNormalized : [];
        
        const arraysEqual = currentArray.length === originalArray.length && 
          currentArray.every((item, idx) => JSON.stringify(item) === JSON.stringify(originalArray[idx]));
        
        if (!arraysEqual) {
          const optimized = optimizeImageData({ [section]: currentSection }, { [section]: originalSection });
          changes[section] = optimized[section];
        }
      } else {
        if (JSON.stringify(currentSection) !== JSON.stringify(originalSection)) {
          changes[section] = currentSection;
        }
      }
    });
    
    return Object.keys(changes).length > 0 ? changes : null;
  };

  const handleSave = async () => {
    try {
      if (!originalData) {
        setTimeout(() => handleSave(), 100);
        return;
      }

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
      
      const changedFields = getChangedFields(cleanedData, originalData);
      
      if (!changedFields) {
        alert('No changes detected.');
        return;
      }
      
      const payload = JSON.stringify(changedFields);
      const payloadSizeMB = new Blob([payload]).size / (1024 * 1024);
      
      if (payloadSizeMB > 4) {
        const proceed = window.confirm(
          `Warning: The data to save is ${payloadSizeMB.toFixed(2)}MB, which is very large. ` +
          `This might fail due to size limits. Large images are likely the cause. ` +
          `Consider removing or compressing images. Continue anyway?`
        );
        if (!proceed) return;
      }
      
      const logData = {};
      Object.keys(changedFields).forEach(section => {
        const sectionData = changedFields[section];
        if (section === 'projects' || section === 'gallery') {
          logData[section] = Array.isArray(sectionData) 
            ? `${sectionData.length} items` 
            : 'object';
        } else {
          logData[section] = typeof sectionData === 'object' ? 'object' : sectionData;
        }
      });
      
      console.log('Saving only changed fields...', {
        sections: Object.keys(changedFields),
        size: `${payloadSizeMB.toFixed(2)}MB`,
        preview: logData
      });
      
      if (payloadSizeMB > 4.5) {
        alert(`Warning: Payload is ${payloadSizeMB.toFixed(2)}MB. Vercel has a 4.5MB limit. ` +
              `Please remove or compress large images before saving.`);
        return;
      }
      
      setSaved(false);
      const result = await savePortfolioData(changedFields, true);
      console.log('Save result:', result);
      
      if (result && result.success !== false) {
        setSaved(true);
        clearCache();
        loadedSectionsRef.current.clear();
        
        const coreResult = await getCorePortfolioData(true);
        const allSections = ['skills', 'projects', 'experience', 'education', 'certificates', 'gallery'];
        const sectionsData = await getPortfolioSections(allSections, true);
        
        const freshData = {
          personal: coreResult.data.personal || data.personal,
          social: coreResult.data.social || data.social,
          ...sectionsData
        };
        
        setData(freshData);
        setOriginalData(JSON.parse(JSON.stringify(freshData)));
        allSections.forEach(s => loadedSectionsRef.current.add(s));
        loadedSectionsRef.current.add('personal');
        loadedSectionsRef.current.add('social');
        ['personal', 'social', 'experience', 'education', 'gallery', 'skills', 'projects', 'certificates'].forEach(tab => {
          loadedSectionsRef.current.add(tab);
        });
        
        console.log('Data refreshed:', freshData);
        
        window.dispatchEvent(new Event('portfolioDataUpdated'));
        
        setTimeout(() => {
          setSaved(false);
        }, 2000);
      } else {
        const errorMsg = result?.error || result?.message || 'Failed to save data. Please try again.';
        console.error('Save failed:', errorMsg, result);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert(`Error saving data: ${error.message}`);
      setSaved(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all data to defaults? This cannot be undone.')) {
      try {
        await resetPortfolioData();
        clearCache();
        loadedSectionsRef.current.clear();
        
        const coreResult = await getCorePortfolioData(true);
        const allSections = ['skills', 'projects', 'experience', 'education', 'certificates', 'gallery'];
        const sectionsData = await getPortfolioSections(allSections, true);
        
        const freshData = {
          personal: coreResult.data.personal || defaultData.personal,
          social: coreResult.data.social || defaultData.social,
          ...sectionsData
        };
        
        setData(freshData);
        setOriginalData(JSON.parse(JSON.stringify(freshData)));
        allSections.forEach(s => loadedSectionsRef.current.add(s));
        loadedSectionsRef.current.add('personal');
        loadedSectionsRef.current.add('social');
        ['personal', 'social', 'experience', 'education', 'gallery', 'skills', 'projects', 'certificates'].forEach(tab => {
          loadedSectionsRef.current.add(tab);
        });
        
        window.dispatchEvent(new Event('portfolioDataUpdated'));
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('Failed to reset data. Please try again.');
      }
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
    if (gallery[index]) {
      gallery[index] = { ...gallery[index], [field]: value };
      setData({ ...data, gallery });
    }
  };

  const addGalleryItem = () => {
    const newId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setData({
      ...data,
      gallery: [
        ...(data.gallery || []),
        { id: newId, title: '', description: '', url: '' },
      ],
    });
  };

  const removeGalleryItem = (index) => {
    const gallery = [...(data.gallery || [])];
    gallery.splice(index, 1);
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
          image: '',
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
                {tabs.map((tab) => {
                  const isLoading = Array.from(loadingSections).some(section => 
                    tabToSectionMap[tab.id]?.includes(section)
                  );
                  const isLoaded = loadedSectionsRef.current.has(tab.id);
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        activeTab === tab.id
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                          : 'text-stone-400 hover:text-stone-300 hover:bg-stone-800/50'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {isLoading && (
                        <svg className="w-4 h-4 animate-spin text-teal-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {isLoaded && !isLoading && (
                        <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
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
                                    alt={certificate.title || certificate.name || 'Certificate preview'}
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


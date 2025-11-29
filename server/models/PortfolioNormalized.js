export const createPortfolioNormalizedModels = (mongoose) => {
  const personalSchema = new mongoose.Schema({
    name: { type: String, default: "DIO" },
    headerLogo: { type: String, default: "" },
    title: { type: String, default: "Full Stack Developer" },
    location: { type: String, default: "Your Location" },
    email: { type: String, default: "your.email@example.com" },
    phone: { type: String, default: "+1 (234) 567-8900" },
    heroBio: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" }
  }, { _id: false });

  const socialSchema = new mongoose.Schema({
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    email: { type: String, default: "" }
  }, { _id: false });

  const portfolioSchema = new mongoose.Schema({
    personal: { type: personalSchema, required: true },
    social: { type: socialSchema, required: true },
    isCustomized: { type: Boolean, default: false }
  }, {
    timestamps: true
  });

  portfolioSchema.index({ 'personal.email': 1 });

  const skillSchema = new mongoose.Schema({
    portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    name: { type: String, required: true },
    level: { type: Number, default: 0 },
    order: { type: Number, default: 0 }
  }, {
    timestamps: true
  });

  skillSchema.index({ portfolioId: 1, order: 1 });

  const projectSchema = new mongoose.Schema({
    portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    images: [{ type: String }],
    technologies: [{ type: String }],
    github: { type: String, default: "" },
    live: { type: String, default: "" },
    order: { type: Number, default: 0 }
  }, {
    timestamps: true
  });

  projectSchema.index({ portfolioId: 1, order: 1 });
  projectSchema.index({ portfolioId: 1 });

  const experienceSchema = new mongoose.Schema({
    portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    role: { type: String, required: true },
    company: { type: String, required: true },
    period: { type: String, default: "" },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 }
  }, {
    timestamps: true
  });

  experienceSchema.index({ portfolioId: 1, order: 1 });
  experienceSchema.index({ portfolioId: 1 });

  const educationSchema = new mongoose.Schema({
    portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    period: { type: String, default: "" },
    order: { type: Number, default: 0 }
  }, {
    timestamps: true
  });

  educationSchema.index({ portfolioId: 1, order: 1 });
  educationSchema.index({ portfolioId: 1 });

  const certificateSchema = new mongoose.Schema({
    portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    name: { type: String, required: true },
    issuer: { type: String, default: "" },
    date: { type: String, default: "" },
    url: { type: String, default: "" },
    image: { type: String, default: "" },
    order: { type: Number, default: 0 }
  }, {
    timestamps: true
  });

  certificateSchema.index({ portfolioId: 1, order: 1 });
  certificateSchema.index({ portfolioId: 1 });

  const gallerySchema = new mongoose.Schema({
    portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, default: "" },
    order: { type: Number, default: 0 }
  }, {
    timestamps: true
  });

  gallerySchema.index({ portfolioId: 1, order: 1 });
  gallerySchema.index({ portfolioId: 1 });

  const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);
  const Skill = mongoose.models.Skill || mongoose.model('Skill', skillSchema);
  const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
  const Experience = mongoose.models.Experience || mongoose.model('Experience', experienceSchema);
  const Education = mongoose.models.Education || mongoose.model('Education', educationSchema);
  const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
  const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);

  Portfolio.getPortfolio = async function() {
    return await this.findOne();
  };

  Portfolio.getFullPortfolio = async function() {
    try {
      const portfolio = await this.findOne().lean().maxTimeMS(3000);
      if (!portfolio) return null;

      const portfolioId = portfolio._id;
      
      const queries = [
        Skill.find({ portfolioId }).select('name level order').sort({ order: 1 }).lean().maxTimeMS(2000),
        Project.find({ portfolioId }).select('title description images technologies github live order').sort({ order: 1 }).lean().maxTimeMS(2000),
        Experience.find({ portfolioId }).select('role company period description order').sort({ order: 1 }).lean().maxTimeMS(2000),
        Education.find({ portfolioId }).select('degree institution period order').sort({ order: 1 }).lean().maxTimeMS(2000),
        Certificate.find({ portfolioId }).select('name issuer date url image order').sort({ order: 1 }).lean().maxTimeMS(2000),
        Gallery.find({ portfolioId }).select('title description url order').sort({ order: 1 }).lean().maxTimeMS(2000)
      ];
      
      const [skills, projects, experience, education, certificates, gallery] = await Promise.all(
        queries.map(q => q.catch(() => []))
      );

    return {
      personal: portfolio.personal,
      social: portfolio.social,
      skills: skills.map(s => ({ name: s.name, level: s.level })),
      projects: projects.map(p => ({
        id: p._id.toString(),
        title: p.title,
        description: p.description,
        images: p.images || [],
        technologies: p.technologies || [],
        github: p.github,
        live: p.live
      })),
      experience: experience.map(e => ({
        id: e._id.toString(),
        role: e.role,
        company: e.company,
        period: e.period,
        description: e.description
      })),
      education: education.map(e => ({
        id: e._id.toString(),
        degree: e.degree,
        institution: e.institution,
        period: e.period
      })),
      certificates: certificates.map(c => ({
        id: c._id.toString(),
        title: c.name,
        name: c.name,
        issuer: c.issuer,
        date: c.date,
        credentialUrl: c.url,
        url: c.url,
        image: c.image
      })),
      gallery: gallery.map(g => ({
        id: g._id.toString(),
        title: g.title,
        description: g.description,
        url: g.url
      })),
      isCustomized: portfolio.isCustomized
    };
    } catch (error) {
      console.error('Error in getFullPortfolio:', error);
      return null;
    }
  };

  Portfolio.updatePortfolio = async function(data) {
    let portfolio = await this.findOne();
    const email = data.personal?.email;
    const isCustomized = email && email !== "your.email@example.com" && email !== "";
    
    if (!portfolio) {
      portfolio = await this.create({
        personal: data.personal || {},
        social: data.social || {},
        isCustomized: isCustomized || false
      });
    } else {
      if (data.personal) portfolio.personal = { ...portfolio.personal, ...data.personal };
      if (data.social) portfolio.social = { ...portfolio.social, ...data.social };
      if (email && email !== "your.email@example.com" && email !== "") {
        portfolio.isCustomized = true;
      } else if (portfolio.isCustomized === undefined) {
        portfolio.isCustomized = false;
      }
      await portfolio.save();
    }

    const portfolioId = portfolio._id;

    if (data.skills !== undefined) {
      await Skill.deleteMany({ portfolioId });
      if (Array.isArray(data.skills) && data.skills.length > 0) {
        const skillsToInsert = data.skills.map((skill, index) => ({
          portfolioId,
          name: skill.name || skill,
          level: skill.level || 0,
          order: index
        }));
        await Skill.insertMany(skillsToInsert);
      }
    }

    if (data.projects !== undefined) {
      await Project.deleteMany({ portfolioId });
      if (Array.isArray(data.projects) && data.projects.length > 0) {
        const projectsToInsert = data.projects.map((project, index) => ({
          portfolioId,
          title: project.title,
          description: project.description || "",
          images: project.images || [],
          technologies: project.technologies || [],
          github: project.github || "",
          live: project.live || "",
          order: index
        }));
        await Project.insertMany(projectsToInsert);
      }
    }

    if (data.experience !== undefined) {
      await Experience.deleteMany({ portfolioId });
      if (Array.isArray(data.experience) && data.experience.length > 0) {
        const experienceToInsert = data.experience.map((exp, index) => ({
          portfolioId,
          role: exp.role,
          company: exp.company,
          period: exp.period || "",
          description: exp.description || "",
          order: index
        }));
        await Experience.insertMany(experienceToInsert);
      }
    }

    if (data.education !== undefined) {
      await Education.deleteMany({ portfolioId });
      if (Array.isArray(data.education) && data.education.length > 0) {
        const educationToInsert = data.education.map((edu, index) => ({
          portfolioId,
          degree: edu.degree,
          institution: edu.institution,
          period: edu.period || "",
          order: index
        }));
        await Education.insertMany(educationToInsert);
      }
    }

    if (data.certificates !== undefined) {
      await Certificate.deleteMany({ portfolioId });
      if (Array.isArray(data.certificates) && data.certificates.length > 0) {
        const certificatesToInsert = data.certificates.map((cert, index) => ({
          portfolioId,
          name: cert.name || cert.title || "",
          issuer: cert.issuer || "",
          date: cert.date || "",
          url: cert.url || cert.credentialUrl || "",
          image: cert.image || "",
          order: index
        }));
        await Certificate.insertMany(certificatesToInsert);
      }
    }

    if (data.gallery !== undefined) {
      await Gallery.deleteMany({ portfolioId });
      if (Array.isArray(data.gallery) && data.gallery.length > 0) {
        const galleryToInsert = data.gallery
          .filter(item => item && item.title && item.title.trim() !== "")
          .map((item, index) => ({
            portfolioId,
            title: item.title || "",
            description: item.description || "",
            url: item.url || "",
            order: index
          }));
        if (galleryToInsert.length > 0) {
          await Gallery.insertMany(galleryToInsert);
        }
      }
    }

    return portfolio;
  };

  Portfolio.resetPortfolio = async function(defaultData) {
    let portfolio = await this.findOne();
    
    if (!portfolio) {
      portfolio = await this.create({
        personal: defaultData.personal || {},
        social: defaultData.social || {},
        isCustomized: false
      });
    } else {
      portfolio.personal = defaultData.personal || {};
      portfolio.social = defaultData.social || {};
      portfolio.isCustomized = false;
      await portfolio.save();
    }

    const portfolioId = portfolio._id;
    await Promise.all([
      Skill.deleteMany({ portfolioId }),
      Project.deleteMany({ portfolioId }),
      Experience.deleteMany({ portfolioId }),
      Education.deleteMany({ portfolioId }),
      Certificate.deleteMany({ portfolioId }),
      Gallery.deleteMany({ portfolioId })
    ]);

    if (defaultData.skills && defaultData.skills.length > 0) {
      const skillsToInsert = defaultData.skills.map((skill, index) => ({
        portfolioId,
        name: skill.name || skill,
        level: skill.level || 0,
        order: index
      }));
      await Skill.insertMany(skillsToInsert);
    }

    if (defaultData.projects && defaultData.projects.length > 0) {
      const projectsToInsert = defaultData.projects.map((project, index) => ({
        portfolioId,
        title: project.title,
        description: project.description || "",
        images: project.images || [],
        technologies: project.technologies || [],
        github: project.github || "",
        live: project.live || "",
        order: index
      }));
      await Project.insertMany(projectsToInsert);
    }

    if (defaultData.experience && defaultData.experience.length > 0) {
      const experienceToInsert = defaultData.experience.map((exp, index) => ({
        portfolioId,
        role: exp.role,
        company: exp.company,
        period: exp.period || "",
        description: exp.description || "",
        order: index
      }));
      await Experience.insertMany(experienceToInsert);
    }

    if (defaultData.education && defaultData.education.length > 0) {
      const educationToInsert = defaultData.education.map((edu, index) => ({
        portfolioId,
        degree: edu.degree,
        institution: edu.institution,
        period: edu.period || "",
        order: index
      }));
      await Education.insertMany(educationToInsert);
    }

    if (defaultData.certificates && defaultData.certificates.length > 0) {
      const certificatesToInsert = defaultData.certificates.map((cert, index) => ({
        portfolioId,
        name: cert.name || cert.title || "",
        issuer: cert.issuer || "",
        date: cert.date || "",
        url: cert.url || cert.credentialUrl || "",
        image: cert.image || "",
        order: index
      }));
      await Certificate.insertMany(certificatesToInsert);
    }

    if (defaultData.gallery && defaultData.gallery.length > 0) {
      const galleryToInsert = defaultData.gallery.map((item, index) => ({
        portfolioId,
        title: item.title || "",
        description: item.description || "",
        url: item.url || "",
        order: index
      }));
      await Gallery.insertMany(galleryToInsert);
    }

    return portfolio;
  };

  return {
    Portfolio,
    Skill,
    Project,
    Experience,
    Education,
    Certificate,
    Gallery
  };
};


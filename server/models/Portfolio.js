// Portfolio model - uses shared mongoose instance to avoid duplicate declarations
// This model is created dynamically with the mongoose instance from api/mongodb.js

export const createPortfolioModel = (mongoose) => {
  const portfolioSchema = new mongoose.Schema({
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {}
    },
    isCustomized: {
      type: Boolean,
      default: false
    }
  }, {
    timestamps: true
  });

  portfolioSchema.statics.getPortfolio = async function() {
    return await this.findOne();
  };

  portfolioSchema.statics.updatePortfolio = async function(data) {
    let portfolio = await this.findOne();
    const isCustomized = data.personal?.email !== "your.email@example.com";
    
    if (!portfolio) {
      portfolio = await this.create({ data, isCustomized });
    } else {
      portfolio.data = data;
      portfolio.isCustomized = isCustomized;
      await portfolio.save();
    }
    
    return portfolio;
  };

  portfolioSchema.statics.resetPortfolio = async function(defaultData) {
    let portfolio = await this.findOne();
    
    if (!portfolio) {
      portfolio = await this.create({ data: defaultData, isCustomized: false });
    } else {
      portfolio.data = defaultData;
      portfolio.isCustomized = false;
      await portfolio.save();
    }
    
    return portfolio;
  };

  // Check if model already exists to avoid overwriting
  if (mongoose.models.Portfolio) {
    return mongoose.models.Portfolio;
  }
  return mongoose.model('Portfolio', portfolioSchema);
};

// For backward compatibility with local server
// Only create default export if mongoose is available
let Portfolio = null;

// Try to create default export for local development
try {
  // This will only work in local dev where server/index.js imports mongoose first
  const mongooseModule = await import('mongoose');
  Portfolio = createPortfolioModel(mongooseModule.default);
} catch {
  // In serverless environment, this will be null and model will be created dynamically
  Portfolio = null;
}

export default Portfolio;

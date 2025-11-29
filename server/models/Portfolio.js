import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  }
}, {
  timestamps: true
});

// Static method to get portfolio data
portfolioSchema.statics.getPortfolio = async function() {
  let portfolio = await this.findOne();
  
  // If no portfolio exists, create one with default data
  if (!portfolio) {
    portfolio = await this.create({ data: {} });
  }
  
  return portfolio;
};

// Static method to update portfolio data
portfolioSchema.statics.updatePortfolio = async function(data) {
  let portfolio = await this.findOne();
  
  if (!portfolio) {
    portfolio = await this.create({ data });
  } else {
    portfolio.data = data;
    await portfolio.save();
  }
  
  return portfolio;
};

// Static method to reset portfolio data
portfolioSchema.statics.resetPortfolio = async function(defaultData) {
  let portfolio = await this.findOne();
  
  if (!portfolio) {
    portfolio = await this.create({ data: defaultData });
  } else {
    portfolio.data = defaultData;
    await portfolio.save();
  }
  
  return portfolio;
};

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;


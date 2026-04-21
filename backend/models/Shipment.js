const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  origin: {
    address: {
      type: String,
      required: [true, 'Origin address is required']
    },
    city: {
      type: String,
      required: [true, 'Origin city is required']
    },
    postalCode: {
      type: String,
      required: [true, 'Origin postal code is required']
    },
    country: {
      type: String,
      required: [true, 'Origin country is required'],
      default: 'Egypt'
    }
  },
  destination: {
    address: {
      type: String,
      required: [true, 'Destination address is required']
    },
    city: {
      type: String,
      required: [true, 'Destination city is required']
    },
    postalCode: {
      type: String,
      required: [true, 'Destination postal code is required']
    },
    country: {
      type: String,
      required: [true, 'Destination country is required'],
      default: 'Egypt'
    }
  },
  recipient: {
    name: {
      type: String,
      required: [true, 'Recipient name is required']
    },
    phone: {
      type: String,
      required: [true, 'Recipient phone is required']
    },
    email: {
      type: String,
      required: false
    }
  },
  package: {
    weight: {
      type: Number,
      required: [true, 'Package weight is required'],
      min: [0.1, 'Weight must be at least 0.1 kg']
    },
    dimensions: {
      length: {
        type: Number,
        required: [true, 'Length is required'],
        min: [1, 'Length must be at least 1 cm']
      },
      width: {
        type: Number,
        required: [true, 'Width is required'],
        min: [1, 'Width must be at least 1 cm']
      },
      height: {
        type: Number,
        required: [true, 'Height is required'],
        min: [1, 'Height must be at least 1 cm']
      }
    },
    description: {
      type: String,
      required: [true, 'Package description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Picked Up', 'In Transit', 'Delivered'],
    default: 'Pending'
  },
  estimatedDelivery: {
    type: Date,
    required: [true, 'Estimated delivery date is required']
  },
  actualDelivery: {
    type: Date
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: [0, 'Cost cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Generate tracking number before saving
shipmentSchema.pre('save', function(next) {
  if (this.isNew) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.trackingNumber = `BST${timestamp}${random}`;
  }
  next();
});

// Update actual delivery date when status is 'Delivered'
shipmentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Delivered' && !this.actualDelivery) {
    this.actualDelivery = new Date();
  }
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);

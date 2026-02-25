// models/shop.models.js
import mongoose, {Schema} from 'mongoose'

const shopSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            index: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        },
        phone: String,
        email: String,
        description: String,
        services: [{
            name: String,
            price: Number,
            duration: Number,
            description: String
        }],
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
                default: [0, 0]
            }
        },
        isActive: {
            type: Boolean,
            default: true
        },
        averageWaitTime: {
            type: Number,
            default: 15
        },
        operatingHours: {
            monday: { open: String, close: String },
            tuesday: { open: String, close: String },
            wednesday: { open: String, close: String },
            thursday: { open: String, close: String },
            friday: { open: String, close: String },
            saturday: { open: String, close: String },
            sunday: { open: String, close: String }
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        images: [String],
        featured: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Create geospatial index
shopSchema.index({ location: '2dsphere' });

// Index for search
shopSchema.index({ 
    name: 'text', 
    'address.city': 'text', 
    'address.street': 'text',
    description: 'text' 
});

// Virtual for full address
shopSchema.virtual('fullAddress').get(function() {
    const parts = [];
    if (this.address.street) parts.push(this.address.street);
    if (this.address.city) parts.push(this.address.city);
    if (this.address.state) parts.push(this.address.state);
    if (this.address.zipCode) parts.push(this.address.zipCode);
    if (this.address.country) parts.push(this.address.country);
    return parts.join(', ');
});

export default mongoose.model('Shop', shopSchema);
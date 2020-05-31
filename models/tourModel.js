const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
    },
    name: {
      type: String,
      required: ['true', 'a tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'a tour name must not be more than 40 characters'],
      minlength: [10, 'a tour must not be less than 10 characters'],
      // validate: [validator.isAlpha, 'name should only contain A-Z'],
    },
    duration: {
      type: Number,
      required: [true, 'a tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'a tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'a tour should have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be more than 1'],
      max: [5, 'Maximum rating is 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: ['true', 'a tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price {VALUE} should be lower than regualr price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: ['true', 'a tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: ['true, a tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GEOJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before the .save() command and .create() command but not insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// USER EMBEDDING SCENARIO
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (guideID) => await User.findById(guideID));

//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

tourSchema.pre('save', function (next) {
  console.log('Will save document....');
  next();
});

tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);

  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  console.log(
    this.pipeline().unshift({
      $match: {
        secretTour: { $ne: true },
      },
    })
  );
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

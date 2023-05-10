import moment from "moment";
import mongoose from "mongoose";
import { z } from "zod";

const rentalMongooseSchema = new mongoose.Schema(
  {
  customer: { // tady by slo pouzit customer schema, ale nechceme mit vsechny udaje o zakaznikovi i v rentalu. Zde nam staci tyhle.
    type: new mongoose.Schema({
      name: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
      },
      isGold: {
        type: Boolean,
        default: false
      },
      phone: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 50
      }
    }),
    required: true
  },
  movie: {
    type: new mongoose.Schema({
      title: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 255
      },
      dailyRentalRate: {
        type: Number,
        required: true,
        min: 0,
        max: 255
      }
    }),
    required: true
  },
  dateOut: {
    type: Date,
    required: true,
    default: Date.now
  },
  dateReturned: {
    type: Date
  },
  rentalFee: {
    type: Number,
    min: 0
  }
  },
  {
    statics: {
      lookup: function (customerId: string, movieId: string):Promise<typeof Rental> {
        return this.findOne({  // protoze pouzivame this, tak nemuzeme pouzit arrow function
          'customer._id': customerId,
          'movie._id': movieId,
        });
      }
    },
    methods: {
      returnRental: function () {
        this.dateReturned = new Date();
        // spocitame difference mezi current moment a rental dateOut, pak to vynasobime tim movie dailyRentalRatem
        this.rentalFee = moment().diff(this.dateOut, 'days') * this.movie.dailyRentalRate;
      }
    }
  }
);

export const Rental = mongoose.model('Rental', rentalMongooseSchema);

const rentalSchema = z.object({
    customerId: z.string().refine((val) => {
      return mongoose.Types.ObjectId.isValid(val)
    }),
    movieId: z.string().refine((val) => {
    return mongoose.Types.ObjectId.isValid(val)
  }),
});
  
type rentalType = z.infer<typeof rentalSchema>;
  
export const validateRental = (rental: rentalType) => {
  // tady by to chtelo jeste validacni fci pro validaci existujiciho objectId - customerId a movieId, on pouzil knihovnu joi-objectid,
  // se zodem by to slo asi viz vyse

    return rentalSchema.parse(rental);   // od zakaznika dostaneme jen customerId a movieId, zbytek si poskladame sami
  };
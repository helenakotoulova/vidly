import express from "express";
import mongoose from "mongoose";

export const coursesRouter = express.Router();

const courseSchema = new mongoose.Schema({
    // puvodne:  name: String,
    // pokud chceme aby to bylo required - built in validator in mongoose:
    name: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 255,
      // match: /pattern/ - lze pouzit regex
    },
    category: {
      type: String,
      required:true, 
      enum: ['web', 'mobile', 'network'],  // povolene enumy
      lowercase: true, // mongoose automaticky zkonvertuje zadanou hodnotu na lowercase,
      // existuje take: uppercase:true
      trim: true // removne mezery kolem inputu
  
    },
    author: String,
    tags: {
      type: [String],
      // custom validator:
      validate: {
        // sometimes we need async validator, pak musime nastavit isAsync:true
        isAsync: true, 
        // a validator se zmeni - bude mit 2. arg - callback:
        validator: function (v: string[]) {
          // do some async work - nasimulujeme si to setTimeoutem:
          return new Promise((resolve) => {
            setTimeout(() => {
              const result = v && v.length > 0;
              resolve(result);
            }, 4000);
          });
        },
        // validator: function (v: string[]) {
        //   return v && v.length > 0;
        // },
        // ma optional custom message:
        message: 'A course should have at least one tag.'
      }
    },
    date: { type: Date, default: Date.now }, // default value for this property
    isPublished: Boolean,
    price: {
      type: Number,
      min: 10,
      max: 200,
      required: function () { return this.isPublished }, // tzn. price bude required jen pokud je isPublished true
      // pozn: zde by neslo pouzit arrow fci, ta totiz nema svoje this!!!!!!!!!!
      set: (v: number) => Math.round(v), // setter function is called when we set the property. Takze pokud zadam napr. 15.8, tak se pak beztak v datyabazi obejvi 16
      get: (v:number) => Math.round(v) // pokud je v databazi kurz s cenou 15.8, tak pri getovani toho objektu se to zaokrouhli, takze ja dsotanu v odpovedi z db hodnotu: 16
  
    }
  });
  
  // Pridani classy Course - zkompilovani schematu do modelu:
  const Course = mongoose.model("Course", courseSchema);
  
  const createCourse = async () => {
    // vytvoreni konkretniho objektu - jde o mongoDb document:
    const course = new Course({
      name: "Node.js",
      author: "Mosh",
      category: 'web',
      tags: ["backend"],
      isPublished: true,
      price: 15.8
      // date nemusime zadavat, mame tam pro nej default value
    });
  
    try {
      const result = await course.save();
      console.log(result);
    } catch (e) {
      // muzeme takhle iterovat pres ty errory. Field bude napr. name, category, tags, ...
      for (const field in e.errors) {
        console.error("Could not save the course because of", field, ":", e.errors[field].message);
      }
      
    }
  };
  
  //createCourse()
  
  const getCourses = async () => {
    const pageNumber = 2;
    const pageSize = 10;
    // pageSize a pageNumber tu mam ted hardcoded, in real wordl bychom to dostali jako query parameters z url:
    // /api/courses?pageNumber=2&pageSize=10
  
    //const courses = await Course.find(); // takhle ziskam vsechny
    const courses = await Course
      .find({ author: 'Mosh' }) // takhle je muzu filtrovat napr. dle autora
  
      // comparison operators:
      //.find({ price: { $gte: 10, $lt: 20 } }) // gt = greater than, lt = less than, gte = grathen then or equal,
      // eq = equal, ne = not equal, lte = less than or equal to, in, nin = not in
      // tohle filtrovani tedy bude podle price kurzu - ta ma byt vetsi nebo rovna 10, ale mene nez 20
      // pokud bych chtela filtrovat kurzy, ktere maji price bud 10 nebo 15 nebo 20:
      // .find({price: { $in: [10, 15, 20] }})
  
      // dal muzu pouzivat take logical operators - or, and
      // pokud bych chtela napr. filtrovat kurzy, ktere maji authora Mosh, nebo jsou isPublished, tak to udelam nasledovne:
      // .find().or([{ author: 'Mosh' }, { isPublished: true } ])
  
      // dal muzu pouzivat regex:
      // course author starts with Mosh:
      // .find({ author: /^Mosh/ })
      // course author ends with Hamedani:
      // .find({ author: /Hamedani$/i })  // to i znamena, ze to ma byt case insensitive
      // course author contains Mosh:
      // .find({ author: /.*Mosh.*/ }) // .* znamena, ze tam muze byt zero a vic characters pred tim a za tim.
  
      // pouziti pageSize a pageNumber:
      // .skip((pageNumber -1 ) * pageSize)  // rekne mu, kolik stranek skipnout - zde chceme vykreslit stranku 2, tzn. preskocime 1
      //.limit(pageSize)
  
      .limit(10)
      .sort({ name: 1 }) // takhle je muzu sortovat - napr. dle jmena: 1 znamena ascending, -1 descdending 
      .select({ name: 1, tags: 1 }) // takhle si vybereme jen ty vlastnosti, ktere chceme ziskat
    
      // nekdy nechci vypisovat cele ty objekty, ale chci dostat jen count, pak bych mohla zakomentovat sort a select a dala bych tam jen:
      // .count()
    
    //console.log('courses',courses)
  }
  
  getCourses();
  
  const updateCourse = async (id:string) => {
    // 1. APPROACH - query-first: findById(), modify its properties, save()
    // const course = await Course.findById(id);
    // if (!course) return;
  
    // Takhle lze updatovat properties:
    // course.isPublished = true;
    // course.author = 'Another Author';
  
    // Ale i takhle muzu updatovat properties. Vysledek je identicky.
    // course.set({
    //   isPublished: true,
    //   author: 'Another Author'
    // })
  
    // const result = await course.save(); // tohle ulozi updatovany kurz do databaze (ten save jsme uz pouzili driv pri vytvareni noveho kurzu);
    // console.log(result)
  
    // 2. APPROACH - update first: update directly, optionally: get the updated document
    // const result = await Course.updateOne({ _id: id }, {
    //   $set: {
    //     isPublished: false,
    //     author: 'Mosh H.'
    //   }
    // })
    // console.log(result) // {  acknowledged: true,  modifiedCount: 1,  upsertedId: null,  upsertedCount: 0,  matchedCount: 1}
    
    // Pokud chci updatovat + zobrazit ten novy updatovany kurz, tak udelam tohle:
    const course = await Course.findByIdAndUpdate(id, 
      {
        isPublished: false,
        author: 'Mosh'
      }, { new: true } // pokud tu nedam to new, tak se mi vrati ten originalni nezmeneny kurz
    ) 
    console.log(course)
  }
  
  //updateCourse("6443fcef45b938badb792967");
  
  
  const deleteCourse = async (id:string) => {
    const result = await Course.deleteOne({ _id: id })  // nebo napr: {isPublished:false} - najde prvni, ktery to splnuje a smaze ho
    console.log(result);
  
    // pokud chci smazat a zobrazit smazany kurz, tak pouziju:
    const course = await Course.findByIdAndDelete(id);
    console.log(course) // pokud je uz kurz smazany, tak to vrati null
  }
  //deleteCourse("6443fcef45b938badb792967");
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// const passwordHash = require('password-hash');

var userSchema = new Schema({
  username: {
    type:String,
    required:true,
    unique:true
  },
  password:{
    type:String,
    required:true,
  },
  detail:{
    nama:{
      type:String,
      default: ''
    },
    alamat:{
      type:String,
      default: ''
    },
    noTlp:{
      type:Number,
      default: ''
    },
    jenKel:{
      type:String,
      default: ''
    }
  }
});

userSchema.index({ username: 1 });
// userSchema.generate(passwordHash, password);

//create collection barang
module.exports = mongoose.model('user', userSchema);

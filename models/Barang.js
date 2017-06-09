var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var autoIncrement = require('mongoose-auto-increment');
var uniqueValidator = require('mongoose-unique-validator');

var barangSchema = new Schema({
  kode: {
    type:String,
    unique:[true, 'Kode Barang Sudah pernah Dipakai'],
    required:[true,'Kode Barang Tidak Boleh Kosong'],
    maxlength:[3, 'Kode Barang Tidak Boleh Lebih dari 3 Karakter']
  },
  nama:{
    type:String,
    required:[true,'Nama Barang Tidak Boleh Kosong'],
    lowercase:true,
    minlength:[3,'Nama Barang Kurang dari 3 karakter'],
    maxlength:[20,'Nama Barang Lebih dari 20 karakter'],
    unique:[true, 'Nama Barang Sudah pernah Dipakai']
  }
});

// barangSchema.index({ kode: 1 });
// barangSchema.plugin(autoIncrement.plugin, {
//   model:'barang',
//   field:'kode',
//   incrementBy: 1,
//   startAt: 1
// });
barangSchema.plugin(uniqueValidator);

//create collection barang
module.exports = mongoose.model('barang', barangSchema);

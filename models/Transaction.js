var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var timestamp = require('mongoose-timestamp');

var transaksiSchema = new Schema({
  idTransaksi: {
    type: Number,
    required: true,
    unique: true
  },
  barang: {
    type:String,
    required:true,
    ref: 'barang'
  },
  jmlMasuk:Number,
  jmlKeluar:Number,
  tglTransaksi: {
    type: Number,
    timestamp: true
  }
});

transaksiSchema.index({ idTransaksi: 1 });
transaksiSchema.plugin(autoIncrement.plugin, {
  model:'transaksi',
  field:'idTransaksi',
  incrementBy: 1,
  startAt: 1
});
transaksiSchema.plugin(timestamp);

//create collection transaksi
module.exports = mongoose.model('transaksi', transaksiSchema);

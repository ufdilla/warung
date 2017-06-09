const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const autoIncrement = require('mongoose-auto-increment');
const timestamp = require('mongoose-timestamp');
const Paginate = require('mongoose-paginate');

var transaksiSchema = new Schema({
  idTransaksi: {
    type: Number,
    required: [true, 'Tidak ada idTransaksi'],
    unique: true
  },
  id_item: {
    type:Schema.Types.ObjectId,
    required: true,
    ref: 'barang'
  },
  id_user: {
    type:Schema.Types.ObjectId,
    required:false,
    ref: 'user'
  },
  stok:{
    type:Number,
    default:0
  },
  qtyIn: {
    type:Number,
    // min: [0, 'Terlalu Sedikit.'],
    maxlength:[4, 'Terlalu Banyak'],
    default:0
  },
  qtyOut: {
    type:Number,
    // min: [0, 'Terlalu Sedikit.'],
    maxlength:[4, 'Terlalu Banyak'],
    default:0
  },
  tglTransaksi: {
    type: Number,
    timestamp: true
  }
});

transaksiSchema.statics.listStock = function(){
  let query = [
    { '$group': {
      '_id': '$id_item',
      'qin': {
        '$sum': '$qtyIn'
      },
      'qout': {
        '$sum': '$qtyOut'
      },
    }},
    { '$project': {
      'total': { '$subtract': [ '$qin', '$qout' ] }
    }}];
  return this.aggregate(query).exec();
};

transaksiSchema.statics.inHistory = function(){
  let query = { qtyIn: { $gt: 0 } };
  return this.find(query).sort({'id_item':-1}).exec();
};

transaksiSchema.statics.outHistory = function(){
  let query = { qtyOut: { $gt: 0 } };
  return this.find(query).sort({'id_item':-1}).exec();
};

transaksiSchema.statics.itemKeluar = function(){
  return this.find({ qtyOut: { $gt: 0 } }).sort({'id_item':-1});
};

transaksiSchema.index({ idTransaksi: 1 });

transaksiSchema.plugin(autoIncrement.plugin, {
  model:'transaksi',
  field:'idTransaksi',
  incrementBy: 1,
  startAt: 1
});

transaksiSchema.plugin(timestamp);

transaksiSchema.plugin(Paginate);

Paginate.paginate.Schema = { limit:10 };

//create collection transaksi
module.exports = mongoose.model('transaksi', transaksiSchema);
// transaksi.paginate({}, {offset : 3, limit : 5}, function(result){
//   console.log(result);
// });

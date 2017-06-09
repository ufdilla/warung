var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');

var itemSchema = new Schema({
  itemsId: {
    type:Number,
    required:true,
    unique:true
  },
  itemsName:{
    type:String,
    required:true,
  }
});

itemSchema.index({ kode: 1 });
itemSchema.plugin(autoIncrement.plugin, {
  model:'item',
  field:'itemsId',
  incrementBy: 1,
  startAt: 1
});


//create collection barang
module.exports = mongoose.model('item', barangSchema);

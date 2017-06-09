const express = require ('express');
const app = express();
const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');
const connection = mongoose.connect('mongodb://localhost/warung');
const passwordHash = require('password-hash');
const helmet = require('helmet');
const promiseMap = require('promise-map-series');
const fp = require('lodash/fp');
const object = require('lodash/fp/object');
const extend = require('lodash/fp/extend');
const _ = require('lodash');

autoIncrement.initialize(connection);
mongoose.Promise = global.Promise;

let Barang = require('./models/Barang');
let Transaksi = require('./models/Transaksi');
let User = require('./models/User');
require('./loadMiddleware')(app);
app.use(helmet());

// input data barang
app.post('/item', (req, res) => {
  let { kode, nama, qtyIn } = req.body;
  let barang = new Barang({
    nama : nama,
    kode : kode
  });

  barang.save((error, valueReturn) => {
    let d = new Date();
    let tgl = d.getTime()/1000;
    req.body.tgl;
    let transaksi = new Transaksi({
      id_item: valueReturn._id,
      qtyIn: qtyIn,
      tglTransaksi : tgl
    });

    transaksi.save((error) => {
      console.log(valueReturn._id);
      if (error) return res.status(400).send(error.errors);
      res.status(201).send('Success!');
    });
    if (error) return res.status(400).send(error.errors);
  });
});

// tampil data barang
app.get('/item', (req,res) => {
  let { limit } = req.query;
  limit = parseInt(limit, 10) || 10;

  Barang.count({}).exec((error, count) => {
    Barang.find({})
    .sort({_id:-1})
    .limit(limit)
    .exec((error, barang)  => {
      let response = { total: count, data: barang };
      if (error) return res.status(500).send('Error! Something went Wrong.');
      if (barang.length === 0) {
        return res.status(404).send('Not Found!');
      }
      res.status(200).send(response);
    });
  });
});

// edit data barang
app.put('/item/:id', (req,res) => {
  let id = req.params.id;
  /*
  req.checkBody('nama', 'Tidak Boleh dikosongkan').notEmpty();
  check for errors!
  var errors = req.validationErrors();
  if (errors) {
    res.send('Terjadi kesalahan: ' + util.inspect(errors), 400);
    return;
   }
   */
  const { nama } = req.body;
  if (req.body.nama) {
    Barang.findOneAndUpdate({kode:id}, {$set:{nama}}, (error, data) => {
      if (error) return res.status(500).send(error.errors);
      if (!data) return res.status(304).send('Update Failed!');
      res.status(201).send('Updated!');
    });
  }
  else res.status(500).send('Terjadi Kesalahan.');
});

// input data transaksi masuk
app.post('/transaction/in', (req, res) => {
  let { idTransaksi, tgl, id_item, id_user, qtyIn, stok } = req.body;
  let d = new Date(Date.parse(tgl));
  let tglTransaksi = d.getTime()/1000;
  req.body.tglTransaksi;

  let data = {idTransaksi, tglTransaksi, id_item, id_user, qtyIn, stok};
  const transaksi = new Transaksi(data);

  transaksi.save(error => {
    if (qtyIn === 0 || qtyIn.length == 0) return res.status(500).send('Jumlah barang tidak boleh kosong');
    if (error) return res.status(500).send(error.errors);
    res.status(201).send('Success!');
  });
});

// input data transaksi keluar
app.post('/transaction/out', (req, res) => {
  let { idTransaksi, tgl, id_item, id_user, qtyOut, stok } = req.body;
  let d = new Date(Date.parse(tgl));
  let tglTransaksi = d.getTime()/1000;
  req.body.tglTransaksi;

  let data = {idTransaksi, tglTransaksi, id_item, id_user, qtyOut, stok};
  const transaksi = new Transaksi(data);

  transaksi.save(error => {
    if (qtyOut === 0 || qtyOut.length == 0) return res.status(500).send('Jumlah barang tidak boleh kosong');
    if (error) return res.status(500).send(error.errors);
    res.status(201).send('Success!');
  });
});

// tampil data transaksi
app.get('/transaction', (req, res) => {
  let { limit } = req.query;
  limit = parseInt(limit, 10) || 10;  //limit, 10 = desimal

  Transaksi.count({}, (error, count) => {
    Transaksi.find({})
    .sort({idTransaksi:-1})
    .populate('id_item','nama')
    .populate('id_user','username')
    .limit(limit)
    .exec((error, datatransaksi) => {
      // let d = new Date(Transaksi.tglTransaksi);
      // let tgl = d.getDate() + '-' + d.getMonth() + '-' + d.getFullYear();

      let respons = {total: count, data: datatransaksi};
      if (error) return res.status(500).send('Something wrong with our server');
      if (datatransaksi.length === 0) return res.status(404).send('Not Found!');

      res.status(200).send(respons);
    });
  });
});

// tampil stok barang
app.get('/itemstock', async (req, res) => {
  try {
    let items = await Transaksi.listStock();
    if (items.length === 0) return res.status(404).send('Not Found!');
    let result = await promiseMap(items, async item => {
      let itemInfo = await Barang.findById(item._id).lean().exec();
      // console.log(itemInfo);
      item.name = itemInfo.nama;
      return item;
    }).then(itemsResult => {
      return itemsResult;
    });
    let response = {
      'count': result.length,
      'data': result
    };
    res.status(200).json(response);
  }
  catch (err){
    res.status(500).send('Something Went Error.');
  }
});

// tampil historty transaksi keluar
app.get('/history/out', async (req, res) => {
  Transaksi.find({ qtyOut: { $gt: 0 } })
    .sort({idTransaksi:-1})
    .populate('id_item','nama')
    .populate('id_user','username')
    .exec((error, datatransaksi) => {
      // let d = new Date(Transaksi.tglTransaksi);
      // let tgl = d.getDate() + '-' + d.getMonth() + '-' + d.getFullYear();

      let respons = {total: datatransaksi.length, data: datatransaksi};
      if (error) return res.status(500).send('Something wrong with our server');
      if (datatransaksi.length === 0) return res.status(404).send('Not Found!');

      res.status(200).send(respons);
    });
});

app.get('/history', async (req, res) => {
  try {
    let transactions = await Transaksi.outHistory();
    // console.log(transactions);
    if (transactions.length === 0) return res.status(404).send('Not Found!');
    let items = await Barang.find({_id:'id_item'});
    // console.log(items);
    // let newValue = [];
    // for (let x in items) {
    //   let value = items[x];
    //   let itemVal = value.nama + transactions;
    //   newValue.push(itemVal);
    //   // console.log(itemVal);
    // }
    // let data = transactions.concat(items);
    let response = _.intersectionWith(transactions, items, _.isEqual);
    console.log(response);
    res.status(200).send(response);
  }
  catch (err){
    res.status(500).send('Something Went Error.');
    // console.log(err);
  }
});

// tampil historty transaksi masuk
app.get('/history/in', (req, res) => {
  Transaksi.find({ qtyIn: { $gt: 0 } })
    .sort({idTransaksi:-1})
    .populate('id_item','nama')
    .populate('id_user','username')
    .exec((error, datatransaksi) => {
      // let d = new Date(Transaksi.tglTransaksi);
      // let tgl = d.getDate() + '-' + d.getMonth() + '-' + d.getFullYear();

      let respons = {total: datatransaksi.length, data: datatransaksi};
      if (error) return res.status(500).send('Something wrong with our server');
      if (datatransaksi.length === 0) return res.status(404).send('Not Found!');

      res.status(200).send(respons);
    });
});

// edit data transaksi masuk
app.put('/intransaction/:id', (req,res) => {
  var id = req.params.id;
  const {jmlMasuk} = req.body;
  if (req.body.jmlMasuk) {
    Transaksi.findByIdAndUpdate({idTransaksi : id}, {$set: {jmlMasuk}},
  {new:true}, function(error, data){
    // req.check('jmlMasuk', 'Jumla Harus Berupa Angka').notEmpty().isInt();
    if (!data) return res.status(304).send('Update Failed!');
    if (error) return res.status(500).send(error.errors);
    res.status(201).send('Updated!');
  });
  }
  else res.status(500).send('Terjadi Kesalahan.');
});

// edit data transaksi keluar
app.put('/outtransaction/:id', (req,res) => {
  var id = req.params.id;
  const {jmlKeluar} = req.body;
  if (jmlKeluar) {
    Transaksi.findByIdAndUpdate({idTransaksi : id}, {$set: {jmlKeluar}}, {new:true},
      (error, data) => {
        if (!data) return res.status(304).send('Update Failed!');
        if (error) return res.status(500).send(error.errors);
        res.status(201).send('Updated!');
      });
  }
  else res.status(500).send('Terjadi Kesalahan. Periksa Kembali Inputan.');
});

// input data user
app.post('/regist', (req, res) => {
  let { username, password = passwordHash.isHashed(password), nama, alamat, email, noTlp, jenKel } = req.body;
  let data = {
    username,
    password,
    nama,
    alamat,
    email,
    noTlp,
    jenKel
  };
  const user = new User(data);

  user.save(error => {
    if (error)  return res.status(500).send('Something Went Wrong.');
    if (data.length === 0)  return res.status(400).status('Not Created!');
    res.status(201).send('Success!');
  }
);
});

// tampil data user
app.get('/user', (req, res) => {
  User.find({}, (error, data) => {
    if (error) return res.status(500).send('Something Went Wrong');
    if (data.length === 0) return res.status(404).send('Not Found!');
    res.status(200).send(data);
  });
});

// tampil list transaksi user
app.get('/user/transaction/:id', (req, res) => {
  let id = req.params.id;
  Transaksi.find({id_user : id}, (error, data) => {
    if (error) return res.status(500).send('Something Went Wrong');
    if (data.length === 0) return res.status(404).send('Not Found!');
    res.status(200).send(data);
  });
});

// tampil list barang user
app.get('/user/item/:id', (req, res) => {
  let id = req.params.id;

  Transaksi.find({id_user : id},{id_item:1}, (error, data) => {
    if (error) return res.status(500).send('Something Went Wrong');
    if (data.length === 0) return res.status(404).send('Not Found!');
    res.status(200).send(data);
  });
});

// tampil list transaksi barang
app.get('/item/transaction/:id', (req, res) => {
  let id = req.params.id;

  Transaksi.find({id_item:id}, (error, data) => {
    if (error) return res.status(500).send('Something Went Wrong');
    if (data.length === 0) return res.status(404).send('Not Found!');
    res.status(200).send(data);
  });
});

// tampil detail barang
app.get('/item/detail/:id', (req, res) => {
  let id = req.params.id;

  Transaksi.find({id_item : id}, (error, data) => {
    if (error) return res.status(500).send('Something Went Wrong');
    if (data.length === 0) return res.status(404).send('Not Found!');
    res.status(200).send(data);
  });
});

// tampil list transaksi berdasarkan timeframe
app.get('/coba/:tgl', (req,res) => {
  let tgl = req.params.tgl;
  let d = new Date(tgl);
  let tglTransaksi = d.getTime()/1000;

  Transaksi.find({updatedAt: {$gte :tglTransaksi}}, (error, data) => {
    if (data.length === 0) return res.status(404).send('Not Found');
    res.status(200).send(data);
  });
});

// ref dengan selain object id
app.post('/cobaref', (req,res) => {
  let { id_item } = req.body;
  let data = {
    id_item : id_item
  };
  const transaksi = new Transaksi(data);

  transaksi.save(error => {
    if (error) {
      return res.status(500).send(error.errors);
    }
    res.status(201).send('Success!');
  });
});

app.listen(1777);

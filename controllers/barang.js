module.exports = {
  create: params => {
    const barang = new models.Barang({
      kode: params.kode,
      nama: params.nama,
      id: params.id
    });
    return barang.save();
  }
};

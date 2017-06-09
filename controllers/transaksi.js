module.exports = {
  create: params => {
    const Transaksi = new models.Transaksi({
      idTransaksi: params.idTransaksi,
      barang: params.barang,
      tglTransaksi: params.tglTransaksi,
      jmlMasuk: params.jmlMasuk,
      jmlKeluar: params.jmlKeluar
    });
    return Transaksi.save();
  }
};

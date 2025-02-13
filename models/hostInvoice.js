module.exports = (sequelize, DataTypes) => {
    const hostInvoice = sequelize.define('hostInvoice', {
        hostName: DataTypes.STRING,
        subAccountCode: DataTypes.STRING,
        paymentReference: DataTypes.STRING,
        amountPaid: DataTypes.DECIMAL(10, 2),
        bookingFee: DataTypes.DECIMAL(10, 2),
        sessionTitle: DataTypes.STRING,     
        vat: DataTypes.DECIMAL(10, 2), 
        infimuseAmount: DataTypes.DECIMAL(10, 2),   
        totalPayable: DataTypes.DECIMAL(10, 2),
        hostId: DataTypes.INTEGER,  
        status: {                   
            type: DataTypes.STRING,
            defaultValue: 'pending'
        },
        paidAt: DataTypes.DATE      
    });
    return hostInvoice;
};
module.exports=(sequelize,DataTypes)=>{
    const SubAccount=sequelize.define("subAccount",{
        email:{
            type:DataTypes.STRING,
            allowNull:false,
            unique:true
        },
        firstName:{
            type:DataTypes.STRING,
            allowNull:false
        },
        business_name:{
            type:DataTypes.STRING,
            allowNull:true
        },
        bank_account_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        bank_code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        paystack_setup_pending: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        paystack_subaccount_code: {
            type: DataTypes.STRING,
            allowNull: true
        },
        
    });
    return SubAccount;
}
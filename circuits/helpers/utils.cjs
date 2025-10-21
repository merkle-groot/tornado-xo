function parseUnits(amount, decimals){
    return amount * (10 ** decimals);
}

module.exports = {
    parseUnits
};
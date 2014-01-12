const ERROR_NETWORK_UNKNOWN = {id: 0, msg: 'Unable to fetch handshake servers configuration'};
const ERROR_NETWORK_OFFLINE = {id: 1, msg: "There's no available network"};
const ERROR_REQUEST_FAILURE = {id: 2, msg: 'Unable to fetch handshake servers configuration'};
const ERROR_REQUEST_EMPTY   = {id: 3, msg: 'Handshake servers configuration is empty'};

const ERROR_NO_PEERS        = {id: 4, msg: 'Not connected to any peer'};


exports.ERROR_NETWORK_UNKNOWN = ERROR_NETWORK_UNKNOWN;
exports.ERROR_NETWORK_OFFLINE = ERROR_NETWORK_OFFLINE;
exports.ERROR_REQUEST_FAILURE = ERROR_REQUEST_FAILURE;
exports.ERROR_REQUEST_EMPTY   = ERROR_REQUEST_EMPTY;
exports.ERROR_NO_PEERS        = ERROR_NO_PEERS;
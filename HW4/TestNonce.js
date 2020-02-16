let nonce = new Uint8Array(4).fill(0);
//console.log();
let overFlow = 0;

function incrementNonce(){
    let cary = 1;
    for(let i=0; i< nonce.length; i++){
        let prev = nonce[i];
        nonce[i] += cary;
        cary = prev > nonce[i] ? 1 : 0;
    };
}

for(let i=0; i<256*256*256*4+1; i++){
    console.log(nonce);
    incrementNonce();
}
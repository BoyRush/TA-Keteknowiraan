from blockchain.web3_config import (
    w3,
    contract,
    PRIVATE_KEY,
    ACCOUNT_ADDRESS
)

def store_herbal_cid_to_blockchain(cid: str):
    nonce = w3.eth.get_transaction_count(ACCOUNT_ADDRESS)

    tx = contract.functions.storeHerbalData(cid).build_transaction({
        "from": ACCOUNT_ADDRESS,
        "nonce": nonce,
        "gas": 300000,
        "gasPrice": w3.to_wei("20", "gwei")
    })

    signed_tx = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt.transactionHash.hex()

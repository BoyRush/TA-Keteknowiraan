# from .contract import contract, web3
# from web3.exceptions import ContractLogicError, BadFunctionCallOutput
# from ipfs.ipfs_service import get_json_from_ipfs
# from .contract import contract, web3
from blockchain.contract import web3, contract
from ipfs.ipfs_service import get_json_from_ipfs
from web3.exceptions import ContractLogicError, BadFunctionCallOutput


def store_medical_record(doctor_pk, patient_addr, cid):
    # Ambil alamat dokter dari Private Key
    doctor_account = web3.eth.account.from_key(doctor_pk)
    
    # Pastikan memanggil fungsi addRecord (atau nama fungsi di Solidity kamu)
    # Dan parameter yang dikirim adalah 'cid' (bukan medical_data mentah)
    nonce = web3.eth.get_transaction_count(doctor_account.address)
    
    txn = contract.functions.addRecord(patient_addr, cid).build_transaction({
        'from': doctor_account.address,
        'nonce': nonce,
        'gas': 500000,
        'gasPrice': web3.to_wei('50', 'gwei')
    })
    
    signed_txn = web3.eth.account.sign_transaction(txn, private_key=doctor_pk)
    tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
    return web3.to_hex(tx_hash)

def get_patient_medical_conditions(patient_address, doctor_private_key):
    try:
        doctor_account = web3.eth.account.from_key(doctor_private_key)

        records = contract.functions.getMedicalRecords(
            patient_address
        ).call({
            "from": doctor_account.address
        })

    except Exception as e:
        print("ACCESS ERROR:", e)
        return []

    conditions = []
    for record in records:
        cid = record[0]
        data = get_json_from_ipfs(cid)

        if data and "kondisi_medis" in data:
            conditions.extend([c.lower() for c in data["kondisi_medis"]])

    return list(set(conditions))


def grant_access(patient_private_key, doctor_address):
    account = web3.eth.account.from_key(patient_private_key)

    tx = contract.functions.grantAccess(doctor_address).build_transaction({
        "from": account.address,
        "nonce": web3.eth.get_transaction_count(account.address),
        "gas": 200000,
        "gasPrice": web3.eth.gas_price
    })

    signed = account.sign_transaction(tx)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash.hex()


def revoke_access(patient_private_key, doctor_address):
    account = web3.eth.account.from_key(patient_private_key)

    tx = contract.functions.revokeAccess(doctor_address).build_transaction({
        "from": account.address,
        "nonce": web3.eth.get_transaction_count(account.address),
        "gas": 200000,
        "gasPrice": web3.eth.gas_price
    })

    signed = account.sign_transaction(tx)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash.hex()

def reject_access(patient_private_key, doctor_address):
    account = web3.eth.account.from_key(patient_private_key)
    
    tx = contract.functions.rejectAccess(
        web3.to_checksum_address(doctor_address)
    ).build_transaction({
        "from": account.address,
        "nonce": web3.eth.get_transaction_count(account.address),
        "gas": 300000,
        "gasPrice": web3.eth.gas_price
    })
    
    signed = account.sign_transaction(tx)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash.hex()

def request_access_from_doctor(doctor_private_key, patient_address):
    account = web3.eth.account.from_key(doctor_private_key)
    
    # Memanggil fungsi requestAccess di Smart Contract
    tx = contract.functions.requestAccess(patient_address).build_transaction({
        "from": account.address,
        "nonce": web3.eth.get_transaction_count(account.address),
        "gas": 200000,
        "gasPrice": web3.eth.gas_price
    })

    signed = account.sign_transaction(tx)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    return tx_hash.hex()

def get_medical_records_as_doctor(patient_address, doctor_address):
    try:
        records = contract.functions.getMedicalRecords(
            patient_address
        ).call({
            "from": doctor_address
        })

        return [
            {
                "cid": r[0],
                "timestamp": r[1]
            }
            for r in records
        ]

    except (ContractLogicError, BadFunctionCallOutput):
        return {
            "error": "Access denied"
        }


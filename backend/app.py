from flask import Flask, request, jsonify
import csv
import os

app = Flask(__name__)

DONATIONS_FILE = 'donations.csv'

@app.route('/donate', methods=['POST'])
def donate():
    data = request.json
    name = data.get('name')
    amount = data.get('amount')
    currency = data.get('currency', 'INR')
    txn_id = data.get('txn_id', 'test_txn')
    
    if not name or not amount:
        return jsonify({'status': 'error', 'message': 'Name and amount are required.'}), 400

    file_exists = os.path.isfile(DONATIONS_FILE)
    with open(DONATIONS_FILE, 'a', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        if not file_exists:
            writer.writerow(['Name', 'Amount', 'Currency', 'TransactionID'])
        writer.writerow([name, amount, currency, txn_id])
    
    return jsonify({'status': 'success', 'message': 'Donation recorded.'}), 200

@app.route('/')
def home():
    return 'Donation backend is running.'

if __name__ == '__main__':
    app.run(debug=True, port=5000)

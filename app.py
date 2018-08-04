from flask import Flask, render_template, url_for, jsonify
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant
from faker import Factory
import os

app = Flask(__name__, static_url_path='')
fake = Factory.create()

@app.route('/', methods=['get'])
def index():
    return render_template('index.html')

@app.route('/token')
def gen_token():
    # Substitute your Twilio AccountSid and ApiKey details
    ACCOUNT_SID = 'AC26b05c62b2a3faac5bdd3519341fe265'
    API_KEY_SID = 'SK733ec5148e4224b85c71c9dbba61cf28'
    API_KEY_SECRET = 'SaHY5Pa52vzWv3iJsi09iylN8URjzgWk'

    # Create an Access Token
    token = AccessToken(ACCOUNT_SID, API_KEY_SID, API_KEY_SECRET)

    # Set the Identity of this token
    token.identity = fake.user_name()
    # print(token)

    # Grant access to Video
    grant = VideoGrant()
    token.add_grant(grant)

    # Serialize the token as a JWT
    data = jsonify(identity=token.identity, token=token.to_jwt().decode('utf-8'))
    return data

port = os.getenv('VCAP_APP_PORT', '5000')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(port))
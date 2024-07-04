# may need to pip install qrcode[pil]

import qrcode

# vCard data
vcardData = """
BEGIN:VCARD
VERSION:3.0
FN:Andrew Krause
TEL:+267-348-7593
EMAIL:ajkrause@gmail.com
END:VCARD
"""

qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=0,
)

qr.add_data(vcardData)
qr.make(fit=True)

img = qr.make_image(fill_color='white', back_color='transparent')
img.save('vCardQR.png')


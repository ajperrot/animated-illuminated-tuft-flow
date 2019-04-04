#Alex Perrotti
#ajperrot
#spectrum.py
#Creates a .jpg which represents the heat map color spectrum
#From cold to hot

import string
from PIL import Image

#canvas settings
xLength = 256 * 4
yLength = 256 * 4

#select the heatmap color corresponding to a point on the spectrum
def colorAt(x):
    #set red value
    r = x - 255
    if(r > 255):
        r = 255
    if(r < 0):
        r = 0
    #set green value
    if(x > 255 * 2):
        g = 255 - (x - (255 * 2))
    else:
        g = x
    if(g > 255):
        g = 255
    #set blue value
    b = (255 * 2) - x
    if(b > 255):
        b = 255
    elif(b < 0):
        b = 0


    #return tuple of all 3
    return (r, g, b)
    

#image settings
img = Image.new('RGB', (xLength, yLength), color = 'black')
pix = img.load()

#fill image
for i in range(0, xLength):
    for j in range(0, yLength):
        pix[i, j] = colorAt(i)
img.show()
img.save("spectrum.jpg", "JPEG")
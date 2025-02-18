import logging
from time import sleep

class constrainedDeviceApp(object):

    def __init__(self):
        logging.info("be bop initializing.!.")
    
    def startCda(self):
        logging.info("CDA starting!")

    def stopCda(self):
        logging.info("CDA stopping!")

    
def main():
    cda = constrainedDeviceApp
    cda.startCda()

    sleep(5)

    cda.stopCda()

if __name__ == '__main__':
    main()


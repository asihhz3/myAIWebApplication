
with open("response.txt", 'r') as sfile:
    with open("result.txt", 'w+') as dfile:
        len = sfile.seek(0,2)
        print(f"len: {len}")
        sfile.seek(1,0)
        try:
            while len > 0:
                if len > 0x1001:
                    str = sfile.read(0x1000)
                    len -= 0x1000
                else:
                    str = sfile.read(len - 3)
                    len = 0
                dfile.write(str)
        except EOFError:
            pass